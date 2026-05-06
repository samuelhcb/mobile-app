import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { useAuth } from '../contexts/AuthContext';

interface FaceRecognitionScreenProps {
  onSuccess: (faceData: any) => void;
  onCancel: () => void;
  tipoPonto: string;
}

const FaceRecognitionScreen: React.FC<FaceRecognitionScreenProps> = ({
  onSuccess,
  onCancel,
  tipoPonto,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const cameraRef = useRef<Camera>(null);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (faceDetected && countdown > 0 && !capturing) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && !capturing) {
      capturePhoto();
    }
    return () => clearInterval(interval);
  }, [faceDetected, countdown, capturing]);

  const handleFacesDetected = ({ faces }: { faces: any[] }) => {
    if (faces.length > 0) {
      const face = faces[0];
      // Verificar se o rosto está bem posicionado
      const isWellPositioned = 
        face.bounds.size.width > 150 && 
        face.bounds.size.height > 150 &&
        face.rollAngle < 15 &&
        face.rollAngle > -15;
      
      if (isWellPositioned && !faceDetected) {
        setFaceDetected(true);
      }
    } else {
      setFaceDetected(false);
      setCountdown(3);
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      onSuccess({
        photo: photo.base64,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      Alert.alert('Erro', 'Falha ao capturar foto');
      setCapturing(false);
      setCountdown(3);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'ENTRADA': 'Entrada',
      'SAIDA_INTERVALO': 'Saída Intervalo',
      'RETORNO_INTERVALO': 'Retorno Intervalo',
      'SAIDA': 'Saída',
    };
    return labels[tipo] || tipo;
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Sem permissão para acessar a câmera</Text>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={CameraType.front}
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          runClassifications: FaceDetector.FaceDetectorClassifications.none,
          minDetectionInterval: 100,
          tracking: true,
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.title}>{getTipoLabel(tipoPonto)}</Text>
            <Text style={styles.subtitle}>Posicione seu rosto na moldura</Text>
          </View>

          <View style={styles.faceFrame}>
            <View
              style={[
                styles.faceBorder,
                faceDetected && styles.faceBorderDetected,
              ]}
            >
              {faceDetected && countdown > 0 && !capturing && (
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownText}>{countdown}</Text>
                </View>
              )}
              {capturing && (
                <ActivityIndicator size="large" color="#fff" />
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.instruction}>
              {faceDetected
                ? 'Mantenha o rosto posicionado...'
                : 'Aproxime seu rosto da câmera'}
            </Text>
            
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Camera>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  faceFrame: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceBorder: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  faceBorderDetected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  countdownContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  instruction: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FaceRecognitionScreen;
