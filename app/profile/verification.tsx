import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/providers/LanguageProvider';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

interface DocumentUpload {
  type: 'profile_photo' | 'id_front' | 'id_back' | 'criminal_record' | 'certification' | 'business_license';
  name: string;
  uri: string;
  size: number;
  mimeType: string;
}

const documentTypes = [
  {
    id: 'profile_photo',
    title: 'Foto de Perfil',
    description: 'Una foto clara de tu rostro',
    icon: 'person-circle-outline',
    required: true,
  },
  {
    id: 'id_front',
    title: 'Documento de Identidad (Frente)',
    description: 'Frente de tu DNI, Cédula o Pasaporte',
    icon: 'card-outline',
    required: true,
  },
  {
    id: 'id_back',
    title: 'Documento de Identidad (Dorso)',
    description: 'Dorso de tu DNI o Cédula',
    icon: 'card-outline',
    required: true,
  },
  {
    id: 'criminal_record',
    title: 'Antecedentes Penales',
    description: 'Certificado de antecedentes penales',
    icon: 'shield-checkmark-outline',
    required: false,
  },
  {
    id: 'certification',
    title: 'Certificaciones Profesionales',
    description: 'Certificados de cursos o estudios relevantes',
    icon: 'school-outline',
    required: false,
  },
  {
    id: 'business_license',
    title: 'Licencia de Negocio',
    description: 'Para profesionales con negocio registrado',
    icon: 'business-outline',
    required: false,
  },
];

export default function VerificationScreen() {
  const { t } = useLanguage();
  
  // TODO: Get current user ID from auth context
  const currentUserId = "dummy-user-id" as any;
  
  // TODO: Implement storage API
  // const userDocuments = useQuery(api.storage.getUserDocuments,
  //   currentUserId ? { userId: currentUserId } : "skip"
  // );

  // const uploadDocument = useMutation(api.storage.saveFile);
  const userDocuments = null;
  const uploadDocument = null;
  
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, DocumentUpload>>({});
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  
  const handleDocumentPick = async (documentType: string) => {
    try {
      let result;
      
      if (documentType === 'profile_photo') {
        // For profile photo, allow camera or gallery
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (permissionResult.granted === false) {
          Alert.alert('Permisos requeridos', 'Se necesitan permisos para acceder a la galería');
          return;
        }
        
        const options = [
          { text: 'Cámara', onPress: () => openCamera(documentType) },
          { text: 'Galería', onPress: () => openGallery(documentType) },
          { text: 'Cancelar', style: 'cancel' as const },
        ];
        
        Alert.alert('Seleccionar imagen', 'Elige una opción', options);
        return;
      } else {
        // For documents, use document picker
        result = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'application/pdf'],
          copyToCacheDirectory: true,
        });
      }
      
      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadDocumentFile(documentType, asset);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el documento');
      console.error('Document picker error:', error);
    }
  };
  
  const openCamera = async (documentType: string) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permisos requeridos', 'Se necesitan permisos para acceder a la cámara');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      await uploadDocumentFile(documentType, asset);
    }
  };
  
  const openGallery = async (documentType: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: documentType === 'profile_photo' ? [1, 1] : [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      await uploadDocumentFile(documentType, asset);
    }
  };
  
  const uploadDocumentFile = async (documentType: string, asset: any) => {
    setIsUploading({ ...isUploading, [documentType]: true });
    
    try {
      // Convert asset to document upload format
      const documentUpload: DocumentUpload = {
        type: documentType as any,
        name: asset.name || `${documentType}.${asset.type?.split('/')[1] || 'jpg'}`,
        uri: asset.uri,
        size: asset.size || 0,
        mimeType: asset.type || 'image/jpeg',
      };
      
      // TODO: Implement actual file upload to Convex storage
      // For now, simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadedDocuments({
        ...uploadedDocuments,
        [documentType]: documentUpload
      });
      
      Alert.alert('Éxito', 'Documento subido correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir el documento');
      console.error('Upload error:', error);
    } finally {
      setIsUploading({ ...isUploading, [documentType]: false });
    }
  };
  
  const getDocumentStatus = (documentType: string) => {
    // Check if document exists in uploaded documents or user documents
    const uploaded = uploadedDocuments[documentType];
    const existing = userDocuments?.find((doc: any) => doc.documentType === documentType);
    
    if (uploaded || existing) {
      const status = existing?.verificationStatus || 'pending';
      return {
        status,
        uploaded: true,
        icon: status === 'approved' ? 'checkmark-circle' : 
              status === 'rejected' ? 'close-circle' : 'time',
        color: status === 'approved' ? '#10b981' : 
               status === 'rejected' ? '#ef4444' : '#f59e0b',
      };
    }
    
    return {
      status: 'not_uploaded',
      uploaded: false,
      icon: 'cloud-upload-outline',
      color: '#6b7280',
    };
  };
  
  const submitForVerification = async () => {
    const requiredDocs = documentTypes.filter(doc => doc.required);
    const missingDocs = requiredDocs.filter(doc => {
      const status = getDocumentStatus(doc.id);
      return !status.uploaded;
    });
    
    if (missingDocs.length > 0) {
      Alert.alert(
        'Documentos faltantes', 
        `Debes subir los siguientes documentos requeridos:\n${missingDocs.map(doc => `• ${doc.title}`).join('\n')}`
      );
      return;
    }
    
    Alert.alert(
      'Enviar para verificación',
      'Una vez enviados, nuestro equipo revisará tus documentos en 24-48 horas. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' as const },
        {
          text: 'Enviar', 
          onPress: async () => {
            // TODO: Implement submission logic
            Alert.alert('Enviado', 'Tus documentos han sido enviados para verificación');
          }
        },
      ]
    );
  };
  
  const renderDocumentItem = (documentType: typeof documentTypes[0]) => {
    const status = getDocumentStatus(documentType.id);
    const isUploadingDoc = isUploading[documentType.id];
    
    return (
      <TouchableOpacity
        key={documentType.id}
        style={styles.documentItem}
        onPress={() => !isUploadingDoc && handleDocumentPick(documentType.id)}
        disabled={isUploadingDoc}
      >
        <View style={styles.documentIcon}>
          <Ionicons name={documentType.icon as any} size={24} color="#21ABF6" />
        </View>
        
        <View style={styles.documentContent}>
          <View style={styles.documentHeader}>
            <Text style={styles.documentTitle}>{documentType.title}</Text>
            {documentType.required && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Requerido</Text>
              </View>
            )}
          </View>
          <Text style={styles.documentDescription}>{documentType.description}</Text>
          
          {status.uploaded && (
            <View style={styles.statusContainer}>
              <Ionicons name={status.icon as any} size={16} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.status === 'approved' ? 'Aprobado' :
                 status.status === 'rejected' ? 'Rechazado' : 'En revisión'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.documentAction}>
          {isUploading ? (
            <ActivityIndicator size="small" color="#21ABF6" />
          ) : (
            <Ionicons 
              name={status.uploaded ? "checkmark-circle" : "cloud-upload-outline"} 
              size={24} 
              color={status.uploaded ? "#10b981" : "#6b7280"} 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verificación de Cuenta</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={32} color="#21ABF6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>¿Por qué verificar tu cuenta?</Text>
            <Text style={styles.infoText}>
              La verificación aumenta la confianza de los clientes y te da acceso a trabajos mejor pagados.
            </Text>
          </View>
        </View>
        
        {/* Documents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documentos requeridos</Text>
          
          {documentTypes.map(renderDocumentItem)}
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={submitForVerification}
        >
          <Text style={styles.submitButtonText}>Enviar para Verificación</Text>
        </TouchableOpacity>
        
        {/* Guidelines */}
        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>Pautas para los documentos</Text>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.guidelineText}>Imágenes claras y legibles</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.guidelineText}>Documentos vigentes</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.guidelineText}>Formato JPG, PNG o PDF</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.guidelineText}>Tamaño máximo: 10MB por archivo</Text>
          </View>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    flexDirection: 'row',
    gap: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  documentContent: {
    flex: 1,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  requiredBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  requiredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  documentDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  documentAction: {
    marginLeft: 16,
  },
  submitButton: {
    backgroundColor: '#21ABF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  guidelines: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  guidelineText: {
    fontSize: 14,
    color: '#6b7280',
  },
  bottomSpacing: {
    height: 40,
  },
});