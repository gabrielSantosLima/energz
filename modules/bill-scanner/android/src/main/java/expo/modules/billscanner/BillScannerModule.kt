package expo.modules.billscanner

import android.content.Context
import android.graphics.BitmapFactory
import android.net.Uri
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import org.opencv.android.OpenCVLoader
import org.opencv.android.Utils
import org.opencv.core.Core
import org.opencv.core.Mat
import org.opencv.core.MatOfInt
import org.opencv.core.MatOfPoint
import org.opencv.core.MatOfPoint2f
import org.opencv.core.Point
import org.opencv.core.Rect
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgcodecs.Imgcodecs
import org.opencv.imgproc.Imgproc
import java.io.File
import kotlin.math.max
import kotlin.math.roundToInt

class CropRect : Record {
  @Field var x: Double = 0.0
  @Field var y: Double = 0.0
  @Field var width: Double = 0.0
  @Field var height: Double = 0.0
}

class ProcessOptions : Record {
  @Field var uri: String = ""
  @Field var crop: CropRect = CropRect()
  @Field var maxDimension: Int = 2000
  @Field var margin: Double = 0.08
  @Field var detect: Boolean = true
}

class BillScannerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val openCvReady: Boolean by lazy {
    OpenCVLoader.initLocal()
  }

  override fun definition() = ModuleDefinition {
    Name("BillScanner")

    AsyncFunction("processBill") { options: ProcessOptions ->
      process(options)
    }
  }

  private fun process(options: ProcessOptions): Map<String, Any> {
    if (!openCvReady) {
      throw IllegalStateException("OpenCV could not be initialized.")
    }

    if (options.uri.isEmpty()) {
      throw IllegalArgumentException("The image uri is required.")
    }

    val bitmap = BitmapFactory.decodeFile(toPath(options.uri))
      ?: throw IllegalArgumentException("Could not decode the bill image.")
    val source = Mat()
    Utils.bitmapToMat(bitmap, source)
    bitmap.recycle()

    try {
      val scaled = downscale(source, options.maxDimension.coerceAtLeast(320))
      val scaleX = scaled.cols().toDouble() / source.cols().toDouble()
      val scaleY = scaled.rows().toDouble() / source.rows().toDouble()
      val crop = toRect(options.crop, scaleX, scaleY, scaled.cols(), scaled.rows())

      val (cropped, detected) = cropDocument(
        scaled,
        crop,
        options.margin.coerceIn(0.0, 0.5),
        options.detect,
      )
      val enhanced = enhanceGrayscale(cropped)

      val output = File(context.cacheDir, "bill-${System.currentTimeMillis()}.jpg")
      val written = Imgcodecs.imwrite(
        output.absolutePath,
        enhanced,
        MatOfInt(Imgcodecs.IMWRITE_JPEG_QUALITY, 92),
      )
      if (!written) {
        throw IllegalStateException("Could not write the processed image.")
      }

      val result = mapOf(
        "uri" to Uri.fromFile(output).toString(),
        "width" to enhanced.cols(),
        "height" to enhanced.rows(),
        "detected" to detected,
      )

      enhanced.release()
      cropped.release()
      if (scaled !== source) {
        scaled.release()
      }

      return result
    } finally {
      source.release()
    }
  }

  private fun cropDocument(
    source: Mat,
    crop: Rect,
    margin: Double,
    detect: Boolean,
  ): Pair<Mat, Boolean> {
    if (!detect) {
      return Mat(source, crop).clone() to false
    }

    val search = inflate(crop, margin, source.cols(), source.rows())
    val region = Mat(source, search)
    val quad = findDocumentQuad(region)
    region.release()

    if (quad == null) {
      return Mat(source, crop).clone() to false
    }

    val points = quad.map { Point(it.x + search.x, it.y + search.y) }
    val area = Math.abs(Imgproc.contourArea(MatOfPoint(*points.toTypedArray())))
    val minArea = crop.area() * 0.2
    val maxArea = source.cols().toDouble() * source.rows().toDouble() * 0.98

    if (area < minArea || area > maxArea) {
      return Mat(source, crop).clone() to false
    }

    return warp(source, orderCorners(points)) to true
  }

  private fun findDocumentQuad(region: Mat): List<Point>? {
    val gray = Mat()
    val edges = Mat()
    val hierarchy = Mat()
    val contours = ArrayList<MatOfPoint>()

    try {
      Imgproc.cvtColor(region, gray, Imgproc.COLOR_BGR2GRAY)
      Imgproc.GaussianBlur(gray, gray, Size(5.0, 5.0), 0.0)
      Imgproc.Canny(gray, edges, 75.0, 200.0)

      val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(5.0, 5.0))
      Imgproc.morphologyEx(edges, edges, Imgproc.MORPH_CLOSE, kernel)
      kernel.release()

      Imgproc.findContours(
        edges,
        contours,
        hierarchy,
        Imgproc.RETR_LIST,
        Imgproc.CHAIN_APPROX_SIMPLE,
      )

      val regionArea = region.cols().toDouble() * region.rows().toDouble()
      var best: List<Point>? = null
      var bestArea = 0.0

      for (contour in contours) {
        val contour2f = MatOfPoint2f(*contour.toArray())
        val perimeter = Imgproc.arcLength(contour2f, true)
        val approx = MatOfPoint2f()
        Imgproc.approxPolyDP(contour2f, approx, 0.02 * perimeter, true)

        if (approx.total().toInt() == 4) {
          val points = approx.toArray().toList()
          val area = Math.abs(Imgproc.contourArea(MatOfPoint(*approx.toArray())))
          if (area >= regionArea * 0.15 && area > bestArea) {
            bestArea = area
            best = points
          }
        }

        contour2f.release()
        approx.release()
        contour.release()
      }

      return best
    } finally {
      gray.release()
      edges.release()
      hierarchy.release()
    }
  }

  private fun warp(source: Mat, corners: List<Point>): Mat {
    val width = max(
      distance(corners[0], corners[1]),
      distance(corners[3], corners[2]),
    ).coerceAtLeast(1.0)
    val height = max(
      distance(corners[0], corners[3]),
      distance(corners[1], corners[2]),
    ).coerceAtLeast(1.0)

    val src = MatOfPoint2f(*corners.toTypedArray())
    val dst = MatOfPoint2f(
      Point(0.0, 0.0),
      Point(width, 0.0),
      Point(width, height),
      Point(0.0, height),
    )
    val matrix = Imgproc.getPerspectiveTransform(src, dst)
    val output = Mat()

    Imgproc.warpPerspective(
      source,
      output,
      matrix,
      Size(width, height),
      Imgproc.INTER_LINEAR,
      Core.BORDER_CONSTANT,
      Scalar(255.0, 255.0, 255.0),
    )

    src.release()
    dst.release()
    matrix.release()

    return output
  }

  private fun enhanceGrayscale(source: Mat): Mat {
    val gray = Mat()
    if (source.channels() == 1) {
      source.copyTo(gray)
    } else {
      Imgproc.cvtColor(source, gray, Imgproc.COLOR_BGR2GRAY)
    }

    val background = Mat()
    Imgproc.GaussianBlur(gray, background, Size(0.0, 0.0), 31.0)

    val normalized = Mat()
    Core.divide(gray, background, normalized, 255.0)

    val blurred = Mat()
    Imgproc.GaussianBlur(normalized, blurred, Size(0.0, 0.0), 3.0)

    val sharpened = Mat()
    Core.addWeighted(normalized, 1.4, blurred, -0.4, 0.0, sharpened)

    gray.release()
    background.release()
    normalized.release()
    blurred.release()

    return sharpened
  }

  private fun downscale(source: Mat, maxDimension: Int): Mat {
    val longest = max(source.cols(), source.rows())
    if (longest <= maxDimension) {
      return source
    }

    val factor = maxDimension.toDouble() / longest
    val output = Mat()
    Imgproc.resize(
      source,
      output,
      Size(source.cols() * factor, source.rows() * factor),
      0.0,
      0.0,
      Imgproc.INTER_AREA,
    )

    return output
  }

  private fun toRect(
    crop: CropRect,
    scaleX: Double,
    scaleY: Double,
    width: Int,
    height: Int,
  ): Rect {
    if (crop.width <= 0.0 || crop.height <= 0.0) {
      return Rect(0, 0, width, height)
    }

    val x = (crop.x * scaleX).roundToInt().coerceIn(0, width - 1)
    val y = (crop.y * scaleY).roundToInt().coerceIn(0, height - 1)
    val w = (crop.width * scaleX).roundToInt().coerceIn(1, width - x)
    val h = (crop.height * scaleY).roundToInt().coerceIn(1, height - y)

    return Rect(x, y, w, h)
  }

  private fun inflate(rect: Rect, margin: Double, width: Int, height: Int): Rect {
    val dx = (rect.width * margin).roundToInt()
    val dy = (rect.height * margin).roundToInt()
    val x = (rect.x - dx).coerceAtLeast(0)
    val y = (rect.y - dy).coerceAtLeast(0)
    val right = (rect.x + rect.width + dx).coerceAtMost(width)
    val bottom = (rect.y + rect.height + dy).coerceAtMost(height)

    return Rect(x, y, right - x, bottom - y)
  }

  private fun orderCorners(points: List<Point>): List<Point> {
    val bySum = points.sortedBy { it.x + it.y }
    val byDiff = points.sortedBy { it.x - it.y }

    return listOf(bySum.first(), byDiff.last(), bySum.last(), byDiff.first())
  }

  private fun distance(a: Point, b: Point): Double =
    Math.hypot(a.x - b.x, a.y - b.y)

  private fun toPath(uri: String): String {
    if (uri.startsWith("file://")) {
      return Uri.parse(uri).path ?: uri
    }

    return uri
  }
}
