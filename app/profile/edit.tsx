import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/providers/LanguageProvider';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { router } from 'expo-router';

export default function EditProfileScreen() {
  const { t } = useLanguage();
  
  // TODO: Get current user ID from auth context
  const currentUserId = "dummy-user-id" as any;
  
  const userProfile = useQuery(api.users.getUser,
    currentUserId ? { userId: currentUserId } : "skip"
  );

  // const updateProfile = useMutation(api.users.updateUser);
  const updateProfile = null; // TODO: implement updateUser mutation
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    hourlyRate: '',
    currency: 'ARS',
    availability: '',
    skills: [] as string[],
    categories: [] as string[],
    location: {
      address: '',
      lat: 0,
      lng: 0,
    },
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  
  const availabilityOptions = [
    'Tiempo completo',
    'Medio tiempo',
    'Fines de semana',
    'Ocasional',
    'Por proyecto'
  ];
  
  const categoryOptions = [
    'Plomería',
    'Electricidad',
    'Carpintería',
    'Pintura',
    'Limpieza',
    'Jardinería',
    'Mudanzas',
    'Reparaciones'
  ];
  
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        bio: userProfile.bio || '',
        hourlyRate: userProfile.hourlyRate?.toString() || '',
        currency: userProfile.currency || 'ARS',
        availability: userProfile.availability || '',
        skills: userProfile.skills || [],
        categories: userProfile.categories || [],
        location: userProfile.location || {
          address: '',
          lat: 0,
          lng: 0,
        },
      });
    }
  }, [userProfile]);
  
  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (!updateProfile) {
        throw new Error('Update profile function not available');
      }
      await updateProfile({
        userId: currentUserId,
        name: formData.name,
        phone: formData.phone || undefined,
        bio: formData.bio || undefined,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        currency: formData.currency,
        availability: formData.availability || undefined,
        skills: formData.skills.length > 0 ? formData.skills : undefined,
        categories: formData.categories.length > 0 ? formData.categories : undefined,
        location: formData.location.address ? formData.location : undefined,
      });
      
      Alert.alert('Éxito', 'Perfil actualizado correctamente', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };
  
  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };
  
  const toggleCategory = (category: string) => {
    const isSelected = formData.categories.includes(category);
    if (isSelected) {
      setFormData({
        ...formData,
        categories: formData.categories.filter(c => c !== category)
      });
    } else {
      setFormData({
        ...formData,
        categories: [...formData.categories, category]
      });
    }
  };
  
  if (userProfile === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#21ABF6" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
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
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#21ABF6" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre completo *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholder="Ingresa tu nombre completo"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.textInput}
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
              placeholder="Ej: +54 9 11 1234-5678"
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Biografía</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.bio}
              onChangeText={(text) => setFormData({...formData, bio: text})}
              placeholder="Cuéntanos sobre ti y tu experiencia..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
        
        {/* Professional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Profesional</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tarifa por hora</Text>
            <View style={styles.currencyRow}>
              <TextInput
                style={[styles.textInput, styles.currencyInput]}
                value={formData.hourlyRate}
                onChangeText={(text) => setFormData({...formData, hourlyRate: text})}
                placeholder="0"
                keyboardType="numeric"
              />
              <Text style={styles.currencyText}>{formData.currency}</Text>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Disponibilidad</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.availabilityOptions}>
                {availabilityOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.availabilityOption,
                      formData.availability === option && styles.availabilityOptionSelected
                    ]}
                    onPress={() => setFormData({...formData, availability: option})}
                  >
                    <Text style={[
                      styles.availabilityOptionText,
                      formData.availability === option && styles.availabilityOptionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
        
        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habilidades</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Agregar habilidad</Text>
            <View style={styles.skillInputRow}>
              <TextInput
                style={[styles.textInput, styles.skillInput]}
                value={skillInput}
                onChangeText={setSkillInput}
                placeholder="Ej: Soldadura, Instalación eléctrica..."
                onSubmitEditing={addSkill}
              />
              <TouchableOpacity style={styles.addButton} onPress={addSkill}>
                <Ionicons name="add" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.skillsContainer}>
            {formData.skills.map((skill) => (
              <View key={skill} style={styles.skillTag}>
                <Text style={styles.skillTagText}>{skill}</Text>
                <TouchableOpacity onPress={() => removeSkill(skill)}>
                  <Ionicons name="close" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
        
        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías de Servicio</Text>
          
          <View style={styles.categoryGrid}>
            {categoryOptions.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  formData.categories.includes(category) && styles.categoryOptionSelected
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Text style={[
                  styles.categoryOptionText,
                  formData.categories.includes(category) && styles.categoryOptionTextSelected
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección</Text>
            <TextInput
              style={styles.textInput}
              value={formData.location.address}
              onChangeText={(text) => setFormData({
                ...formData,
                location: {...formData.location, address: text}
              })}
              placeholder="Ingresa tu dirección"
            />
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#21ABF6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyInput: {
    flex: 1,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  availabilityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  availabilityOption: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  availabilityOptionSelected: {
    backgroundColor: '#21ABF6',
    borderColor: '#21ABF6',
  },
  availabilityOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  availabilityOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  skillInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skillInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#21ABF6',
    borderRadius: 8,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  skillTag: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#21ABF6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skillTagText: {
    fontSize: 14,
    color: '#21ABF6',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOption: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: '30%',
    alignItems: 'center',
  },
  categoryOptionSelected: {
    backgroundColor: '#21ABF6',
    borderColor: '#21ABF6',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  categoryOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
});