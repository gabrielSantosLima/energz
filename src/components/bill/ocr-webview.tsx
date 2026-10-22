import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  imageBase64: string;
  lang?: string;
  onResult: (text: string) => void;
  onError: (message: string) => void;
};

function buildHtml(base64: string, lang: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
    <script>
      const image = "data:image/jpeg;base64,${base64}";
      const lang = ${JSON.stringify(lang)};
      (async () => {
        let worker = null;
        try {
          worker = await Tesseract.createWorker(lang, 1);
          await worker.setParameters({
            preserve_interword_spaces: '1',
          });
          const result = await worker.recognize(image);
          const text = result.data.text;
          await worker.terminate();
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'result', text })
          );
        } catch (error) {
          if (worker) {
            try {
              await worker.terminate();
            } catch (_) {}
          }
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'error', message: String(error) })
          );
        }
      })();
    </script>
  </body>
</html>`;
}

export function OcrWebView({
  imageBase64,
  lang = 'por',
  onResult,
  onError,
}: Props) {
  const html = useMemo(() => buildHtml(imageBase64, lang), [imageBase64, lang]);

  return (
    <WebView
      style={styles.webview}
      originWhitelist={['*']}
      source={{ html }}
      javaScriptEnabled
      onMessage={(event) => {
        try {
          const payload = JSON.parse(event.nativeEvent.data) as {
            type?: string;
            text?: string;
            message?: string;
          };
          if (payload.type === 'result') {
            onResult(String(payload.text ?? ''));
          } else if (payload.type === 'error') {
            onError(String(payload.message ?? 'OCR error'));
          }
        } catch (error) {
          onError(error instanceof Error ? error.message : String(error));
        }
      }}
      onError={() => onError('WebView error while running OCR.')}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    left: 0,
    top: 0,
  },
});
