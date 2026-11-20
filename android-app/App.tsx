import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEBHOOK_URL = 'https://mahq729.app.n8n.cloud/webhook/unab-chat';
const ID_BANNER_PATTERN = /^U00\d{5,8}$/;
const ID_BANNER_KEY = 'id_banner';
const SESSION_ID_KEY = 'session_id';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  isError?: boolean;
}

const SUGERENCIAS = [
  '¿Cuándo inician las clases en 2027-1?',
  'Prerrequisitos de Base de Datos II',
  '¿Cuánto vale una habilitación en 2026?',
  'Plazo de inscripción en COSMOS',
];

interface ChatScreenProps {
  idBanner: string;
  onLogout: () => void;
}

function ChatScreen({ idBanner, onLogout }: ChatScreenProps) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: '¡Hola! Soy el asistente académico de **Ingeniería de Sistemas UNAB**.\n\nPuedes preguntarme sobre:\n* **Calendario académico** (COSMOS, pagos, cancelaciones, grados)\n* **Plan de estudios** (prerrequisitos, créditos y contenidos)\n* **Reglamento estudiantil y tarifas 2026**',
      isUser: false,
    },
  ]);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isLoading]);

  const reiniciarConversacion = () => {
    if (isLoading) return;
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        text: 'Se limpió el historial visible. ¿En qué puedo ayudarte hoy sobre tu programa en la UNAB?',
        isUser: false,
      },
    ]);
  };

  const enviarMensaje = async (textoOpcional?: string) => {
    const texto = (textoOpcional ?? inputText).trim();
    if (!texto || isLoading) return;

    if (!textoOpcional) {
      setInputText('');
    }

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      text: texto,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Controlador de timeout de 60 segundos para consultas híbridas
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          session_id: idBanner,
          id_banner: idBanner,
          mensaje: texto,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const respuestaBot =
        data.respuesta ?? 'No se recibió respuesta del asistente.';

      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          text: respuestaBot,
          isUser: false,
        },
      ]);
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      const errorName =
        typeof error === 'object' && error !== null && 'name' in error
          ? String(error.name)
          : '';
      const mensajeError =
        errorName === 'AbortError'
          ? 'La consulta tardó demasiado en responder. Intenta de nuevo en unos segundos.'
          : 'Error de conexión con el servidor. Verifica tu internet o que el workflow en n8n esté publicado.';

      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          text: mensajeError,
          isUser: false,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    return (
      <View
        style={[
          styles.bubbleContainer,
          item.isUser ? styles.userAlign : styles.botAlign,
        ]}
      >
        {!item.isUser && (
          <View style={[styles.avatar, item.isError && styles.errorAvatar]}>
            <Text style={styles.avatarText}>{item.isError ? '!' : 'A'}</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            item.isUser
              ? styles.userBubble
              : item.isError
              ? styles.errorBubble
              : styles.botBubble,
          ]}
        >
          {item.isUser ? (
            <Text style={styles.userText}>{item.text}</Text>
          ) : (
            <Markdown
              style={{
                body: {
                  color: item.isError ? '#991B1B' : '#1F2937',
                  fontSize: 15,
                  lineHeight: 21,
                },
                strong: { fontWeight: '700' },
                table: {
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 6,
                  marginVertical: 6,
                },
                th: {
                  backgroundColor: '#F3F4F6',
                  padding: 6,
                  fontWeight: '700',
                },
                td: {
                  padding: 6,
                  borderTopWidth: 1,
                  borderColor: '#E5E7EB',
                },
              }}
            >
              {item.text}
            </Markdown>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Encabezado */}
      <View style={styles.header}>
        <View style={styles.headerIdentity}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>A</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Asistente UNAB</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSubtitle}>Ingeniería de Sistemas</Text>
            </View>
            <Text style={styles.activeId}>ID: {idBanner}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={reiniciarConversacion}
            disabled={isLoading}
            style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Iniciar un nuevo chat"
          >
            <Text style={styles.resetButtonText}>Nuevo chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onLogout}
            style={styles.logoutButton}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
          >
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Lista de mensajes */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isLoading ? (
              <View style={styles.typingContainer}>
                <ActivityIndicator size="small" color="#EA580C" />
                <Text style={styles.typingText}>
                  Consultando documentos y calendario...
                </Text>
              </View>
            ) : undefined
          }
        />

        {/* Sugerencias rápidas al inicio */}
        {messages.length <= 1 && !isLoading && (
          <View style={styles.suggestionsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsContent}
            >
              {SUGERENCIAS.map((sug, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chip}
                  onPress={() => enviarMensaje(sug)}
                >
                  <Text style={styles.chipText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Barra de entrada */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe tu consulta académica..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!isLoading}
            returnKeyType="send"
            onSubmitEditing={() => {
              if (inputText.trim() && !isLoading) enviarMensaje();
            }}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={() => enviarMensaje()}
            disabled={!inputText.trim() || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
          >
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface LoginScreenProps {
  onLogin: (idBanner: string) => Promise<void>;
}

function LoginScreen({ onLogin }: LoginScreenProps) {
  const [inputId, setInputId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ingresar = async () => {
    const idBanner = inputId.trim().toUpperCase();
    if (!ID_BANNER_PATTERN.test(idBanner)) {
      setError('Ingresa un ID válido: U00 seguido de 5 a 8 dígitos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogin(idBanner);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.loginSafeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.loginContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.loginCard}>
          <View style={styles.loginAvatar}>
            <Text style={styles.loginAvatarText}>A</Text>
          </View>
          <Text style={styles.loginTitle}>Asistente UNAB</Text>
          <Text style={styles.loginSubtitle}>
            Ingresa tu ID institucional para continuar
          </Text>

          <TextInput
            style={[styles.loginInput, error !== '' && styles.loginInputError]}
            placeholder="Ej. U00123456"
            placeholderTextColor="#9CA3AF"
            value={inputId}
            onChangeText={(value) => {
              setInputId(value.toUpperCase());
              if (error) setError('');
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={11}
            returnKeyType="done"
            onSubmitEditing={() => void ingresar()}
            accessibilityLabel="ID Banner institucional"
          />
          {error !== '' && (
            <Text style={styles.loginErrorText} accessibilityRole="alert">
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.loginButton,
              isSubmitting && styles.loginButtonDisabled,
            ]}
            onPress={() => void ingresar()}
            disabled={isSubmitting}
            accessibilityRole="button"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Ingresar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  const [idBanner, setIdBanner] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');

  const cargarSesion = async () => {
    setIsLoadingSession(true);
    try {
      const savedId = await AsyncStorage.getItem(ID_BANNER_KEY);
      setIdBanner(savedId?.trim().toUpperCase() || null);
      setSessionError('');
    } catch {
      setSessionError('No fue posible leer la sesión guardada en este dispositivo.');
    } finally {
      setIsLoadingSession(false);
    }
  };

  useEffect(() => {
    void cargarSesion();
  }, []);

  const iniciarSesion = async (id: string) => {
    try {
      await AsyncStorage.multiSet([
        [ID_BANNER_KEY, id],
        [SESSION_ID_KEY, id],
      ]);
      setIdBanner(id);
    } catch {
      Alert.alert(
        'No se pudo iniciar sesión',
        'No fue posible guardar tu ID en este dispositivo. Intenta de nuevo.',
      );
    }
  };

  const cerrarSesion = async () => {
    try {
      await AsyncStorage.multiRemove([ID_BANNER_KEY, SESSION_ID_KEY]);
      setIdBanner(null);
    } catch {
      Alert.alert(
        'No se pudo cerrar sesión',
        'No fue posible borrar la sesión guardada. Intenta de nuevo.',
      );
    }
  };

  return (
    <SafeAreaProvider>
      {isLoadingSession ? (
        <SafeAreaView style={styles.sessionLoading}>
          <ActivityIndicator size="large" color="#EA580C" />
        </SafeAreaView>
      ) : sessionError ? (
        <SafeAreaView style={styles.sessionError}>
          <Text style={styles.sessionErrorText}>{sessionError}</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => void cargarSesion()}
            accessibilityRole="button"
          >
            <Text style={styles.loginButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </SafeAreaView>
      ) : idBanner ? (
        <ChatScreen idBanner={idBanner} onLogout={() => void cerrarSesion()} />
      ) : (
        <LoginScreen onLogin={iniciarSesion} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EA580C',
  },
  flexContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#C2410C',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    color: '#C2410C',
    fontSize: 17,
    fontWeight: '800',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#86EFAC',
    marginRight: 6,
  },
  headerSubtitle: {
    color: '#FFEDD5',
    fontSize: 12,
  },
  activeId: {
    color: '#FED7AA',
    fontSize: 10,
    marginTop: 2,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 5,
  },
  resetButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  resetButtonDisabled: {
    opacity: 0.45,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  logoutButtonText: {
    color: '#FFEDD5',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  loginSafeArea: {
    flex: 1,
    backgroundColor: '#C2410C',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  loginCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  loginAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#C2410C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  loginAvatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  loginTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
  },
  loginSubtitle: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  loginInput: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#111827',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  loginInputError: {
    borderColor: '#DC2626',
  },
  loginErrorText: {
    alignSelf: 'flex-start',
    color: '#B91C1C',
    fontSize: 12,
    marginTop: 6,
  },
  loginButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 18,
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sessionLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  sessionError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  sessionErrorText: {
    color: '#991B1B',
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 4,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  bubbleContainer: {
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userAlign: {
    justifyContent: 'flex-end',
  },
  botAlign: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C2410C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  errorAvatar: {
    backgroundColor: '#DC2626',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#EA580C',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorBubble: {
    backgroundColor: '#FEE2E2',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 6,
    marginLeft: 35,
  },
  typingText: {
    marginLeft: 8,
    color: '#4B5563',
    fontSize: 13,
    fontStyle: 'italic',
  },
  suggestionsWrapper: {
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  suggestionsContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: {
    color: '#9A3412',
    fontSize: 12,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: Platform.OS === 'ios' ? 9 : 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 110,
    color: '#111827',
  },
  sendButton: {
    backgroundColor: '#EA580C',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginLeft: 8,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#FDBA74',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});