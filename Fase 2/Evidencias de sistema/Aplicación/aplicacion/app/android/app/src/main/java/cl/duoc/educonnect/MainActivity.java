package cl.duoc.educonnect;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private static final int REQUEST_RECORD_AUDIO = 1001;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;
    private volatile boolean ttsSpeaking = false;
    private String pendingSpeakText = null;
    private int ttsUtteranceCounter = 0;

    private SpeechRecognizer speechRecognizer = null;
    private volatile boolean sttActive = false;
    private volatile boolean sttContinuous = false;
    private volatile boolean sttStoppedByUser = true;
    private int sttSessionCounter = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemBars();
        ensureMicrophonePermission();
        initTextToSpeech();
        registerVoiceBridge();
    }

    @Override
    public void onDestroy() {
        stopNativeListeningInternal();
        if (tts != null) {
            try {
                tts.stop();
                tts.shutdown();
            } catch (Exception ignored) {}
            tts = null;
        }
        ttsReady = false;
        ttsSpeaking = false;
        super.onDestroy();
    }

    private void registerVoiceBridge() {
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            WebView webView = this.getBridge().getWebView();
            webView.addJavascriptInterface(new AndroidVoiceBridge(), "AndroidVoiceBridge");
        }
    }

    private void notifyJs(final String jsCode) {
        mainHandler.post(() -> {
            if (isFinishing() || isDestroyed()) return;
            if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                this.getBridge().getWebView().evaluateJavascript(jsCode, null);
            }
        });
    }

    private void initTextToSpeech() {
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS && tts != null) {
                Locale chile = new Locale("es", "CL");
                int res = tts.setLanguage(chile);
                if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                    res = tts.setLanguage(new Locale("es", "ES"));
                }
                if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                    tts.setLanguage(new Locale("es"));
                }
                tts.setSpeechRate(0.95f);
                tts.setPitch(1.05f);
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override
                    public void onStart(String utteranceId) {
                        ttsSpeaking = true;
                    }

                    @Override
                    public void onDone(String utteranceId) {
                        ttsSpeaking = false;
                        notifyJs("if (window._onAndroidTtsEnd) window._onAndroidTtsEnd();");
                    }

                    @Override
                    public void onError(String utteranceId) {
                        ttsSpeaking = false;
                        notifyJs("if (window._onAndroidTtsEnd) window._onAndroidTtsEnd();");
                    }

                    @Override
                    public void onStop(String utteranceId, boolean interrupted) {
                        ttsSpeaking = false;
                        if (!interrupted) {
                            notifyJs("if (window._onAndroidTtsEnd) window._onAndroidTtsEnd();");
                        }
                    }
                });
                ttsReady = true;
                if (pendingSpeakText != null && !pendingSpeakText.trim().isEmpty()) {
                    String queued = pendingSpeakText;
                    pendingSpeakText = null;
                    speakTextInternal(queued);
                }
            } else {
                ttsReady = false;
                ttsSpeaking = false;
                pendingSpeakText = null;
                notifyJs("if (window._onAndroidTtsEnd) window._onAndroidTtsEnd();");
            }
        });
    }

    private void speakTextInternal(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            ttsSpeaking = false;
            notifyJs("if (window._onAndroidTtsEnd) window._onAndroidTtsEnd();");
            return;
        }
        final String cleanText = rawText.trim();
        mainHandler.post(() -> {
            if (tts == null || !ttsReady) {
                pendingSpeakText = cleanText;
                ttsSpeaking = true;
                mainHandler.postDelayed(() -> {
                    if (!ttsReady && pendingSpeakText != null) {
                        pendingSpeakText = null;
                        ttsSpeaking = false;
                        notifyJs("if (window._onAndroidTtsEnd) window._onAndroidTtsEnd();");
                    }
                }, 2500);
                return;
            }
            ttsUtteranceCounter++;
            String utteranceId = "educonnect_tts_" + ttsUtteranceCounter;
            ttsSpeaking = true;
            int result = tts.speak(cleanText, TextToSpeech.QUEUE_FLUSH, null, utteranceId);
            if (result == TextToSpeech.ERROR) {
                ttsSpeaking = false;
                notifyJs("if (window._onAndroidTtsEnd) window._onAndroidTtsEnd();");
            }
        });
    }

    private void stopSpeakingInternal() {
        pendingSpeakText = null;
        ttsSpeaking = false;
        mainHandler.post(() -> {
            if (tts != null) {
                try {
                    tts.stop();
                } catch (Exception ignored) {}
            }
        });
    }

    private void startNativeListeningInternal(final boolean continuous) {
        mainHandler.post(() -> {
            if (isFinishing() || isDestroyed()) return;
            if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    MainActivity.this,
                    new String[]{Manifest.permission.RECORD_AUDIO},
                    REQUEST_RECORD_AUDIO
                );
                notifyJs("if (window._onAndroidSttError) window._onAndroidSttError('permission_denied');");
                return;
            }
            if (!SpeechRecognizer.isRecognitionAvailable(MainActivity.this)) {
                notifyJs("if (window._onAndroidSttError) window._onAndroidSttError('speech_unavailable');");
                return;
            }

            sttContinuous = continuous;
            sttStoppedByUser = false;
            sttActive = true;
            launchRecognizerSession();
        });
    }

    private void launchRecognizerSession() {
        if (!sttActive || sttStoppedByUser || isFinishing() || isDestroyed()) return;
        sttSessionCounter++;
        final int sessionId = sttSessionCounter;

        if (speechRecognizer != null) {
            try {
                speechRecognizer.destroy();
            } catch (Exception ignored) {}
            speechRecognizer = null;
        }

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(MainActivity.this);
        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override
            public void onReadyForSpeech(Bundle params) {}

            @Override
            public void onBeginningOfSpeech() {}

            @Override
            public void onRmsChanged(float rmsdB) {}

            @Override
            public void onBufferReceived(byte[] buffer) {}

            @Override
            public void onEndOfSpeech() {}

            @Override
            public void onError(int error) {
                if (sessionId != sttSessionCounter || !sttActive || sttStoppedByUser) return;

                boolean fatalError =
                    error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS ||
                    error == SpeechRecognizer.ERROR_AUDIO;

                if (fatalError) {
                    sttActive = false;
                    sttStoppedByUser = true;
                    notifyJs("if (window._onAndroidSttError) window._onAndroidSttError('stt_error_" + error + "');");
                    return;
                }

                if (sttContinuous) {
                    mainHandler.postDelayed(() -> {
                        if (sessionId == sttSessionCounter && sttActive && !sttStoppedByUser) {
                            launchRecognizerSession();
                        }
                    }, 180);
                } else {
                    sttActive = false;
                    if (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                        notifyJs("if (window._onAndroidSttEnd) window._onAndroidSttEnd();");
                    } else {
                        notifyJs("if (window._onAndroidSttError) window._onAndroidSttError('stt_error_" + error + "');");
                    }
                }
            }

            @Override
            public void onResults(Bundle results) {
                if (sessionId != sttSessionCounter || !sttActive || sttStoppedByUser) return;
                ArrayList<String> matches = results != null
                    ? results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    : null;
                String text = (matches != null && !matches.isEmpty()) ? matches.get(0) : "";
                if (text != null && !text.trim().isEmpty()) {
                    String quoted = JSONObject.quote(text.trim());
                    notifyJs("if (window._onAndroidSttResult) window._onAndroidSttResult(" + quoted + ", true);");
                }
                if (sttContinuous && sttActive && !sttStoppedByUser) {
                    mainHandler.postDelayed(() -> {
                        if (sessionId == sttSessionCounter && sttActive && !sttStoppedByUser) {
                            launchRecognizerSession();
                        }
                    }, 120);
                } else {
                    sttActive = false;
                    notifyJs("if (window._onAndroidSttEnd) window._onAndroidSttEnd();");
                }
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                if (sessionId != sttSessionCounter || !sttActive || sttStoppedByUser) return;
                ArrayList<String> matches = partialResults != null
                    ? partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    : null;
                String text = (matches != null && !matches.isEmpty()) ? matches.get(0) : "";
                if (text != null && !text.trim().isEmpty()) {
                    String quoted = JSONObject.quote(text.trim());
                    notifyJs("if (window._onAndroidSttResult) window._onAndroidSttResult(" + quoted + ", false);");
                }
            }

            @Override
            public void onEvent(int eventType, Bundle params) {}
        });

        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-CL");
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "es-CL");
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
        intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
        speechRecognizer.startListening(intent);
    }

    private void stopNativeListeningInternal() {
        sttStoppedByUser = true;
        sttActive = false;
        sttContinuous = false;
        sttSessionCounter++;
        mainHandler.post(() -> {
            if (speechRecognizer != null) {
                try {
                    speechRecognizer.stopListening();
                } catch (Exception ignored) {}
                try {
                    speechRecognizer.destroy();
                } catch (Exception ignored) {}
                speechRecognizer = null;
            }
        });
    }

    public class AndroidVoiceBridge {
        @JavascriptInterface
        public boolean isTtsReady() {
            return ttsReady;
        }

        @JavascriptInterface
        public boolean isSpeaking() {
            return ttsSpeaking;
        }

        @JavascriptInterface
        public void speak(String text) {
            speakTextInternal(text);
        }

        @JavascriptInterface
        public void stopSpeaking() {
            stopSpeakingInternal();
        }

        @JavascriptInterface
        public boolean hasNativeStt() {
            return SpeechRecognizer.isRecognitionAvailable(MainActivity.this);
        }

        @JavascriptInterface
        public void startListening(boolean continuous) {
            startNativeListeningInternal(continuous);
        }

        @JavascriptInterface
        public void stopListening() {
            stopNativeListeningInternal();
        }
    }

    private void ensureMicrophonePermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                new String[]{Manifest.permission.RECORD_AUDIO},
                REQUEST_RECORD_AUDIO
            );
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemBars();
        }
    }

    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
        } else {
            View decorView = getWindow().getDecorView();
            int flags = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                      | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
            decorView.setSystemUiVisibility(flags);
        }
    }
}
