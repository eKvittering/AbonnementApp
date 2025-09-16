import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Modal, Alert, StyleSheet, ScrollView
} from 'react-native';
import Medlemskab from './medlemskab';

export const API_BASE = "http://10.136.130.188:8080";
const API_URL = `${API_BASE}/api/medlemmer`;

export default function Medlem({ onBack = () => {} }) {
  const [filters, setFilters] = useState({
    medlemsnummer: '', fornavn: '', efternavn: '', adresse: '',
    postnummer: '', email: '', fodselsdato: '', mobiltelefon: '', nuvhac: ''
  });
  const [list, setList] = useState([]);
  const [selectedMedlem, setSelectedMedlem] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editMedlem, setEditMedlem] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const debounceRef = useRef(null);
  const suppressRowPress = useRef(false);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyFilters(), 500);
    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  function formatPhone(s) {
    if (!s) return '';
    const d = String(s).replace(/\D/g, '');
    return d.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }

  function formatDate(s){
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleDateString('da-DK', {year:'numeric', month:'2-digit', day:'2-digit'});
  }

  async function applyFilters() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k,v]) => v && params.append(k, v));
    if ([...params].length === 0) {
      setList([]);
      setStatusMsg('');
      return;
    }
    try {
      setStatusMsg('Søger...');
      const res = await fetch(`${API_URL}/search?${params.toString()}`);
      if (!res.ok) throw new Error('Fejl ved søgning');
      const json = await res.json();
      setList(Array.isArray(json) ? json : (json?.content ?? []));
      setStatusMsg(`Viser ${Array.isArray(json) ? json.length : (json?.content?.length ?? 0)} medlemmer`);
    } catch (err) {
      setList([]);
      setStatusMsg('Kan ikke hente medlemmer');
    }
  }

  async function openEditMedlem(medlemId) {
    try {
      const res = await fetch(`${API_URL}/${medlemId}`);
      if (!res.ok) throw new Error('Kunne ikke hente medlem');
      const m = await res.json();
      setEditMedlem(m);
      setEditModalVisible(true);
    } catch (err) {
      Alert.alert('Fejl', err.message);
    }
  }

  async function saveEditMedlem() {
    if (!editMedlem) return;
    try {
      const res = await fetch(`${API_URL}/${editMedlem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editMedlem)
      });
      if (!res.ok) throw new Error('Kunne ikke gemme medlem');
      setEditModalVisible(false);
      applyFilters();
    } catch (err) {
      Alert.alert('Fejl', err.message);
    }
  }

  async function deleteMedlem() {
    if (!editMedlem) return;
    Alert.alert('Bekræft', 'Er du sikker på at du vil slette dette medlem?', [
      { text: 'Annuller', style: 'cancel' },
      {
        text: 'OK', onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/${editMedlem.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Kunne ikke slette medlem');
            setEditModalVisible(false);
            applyFilters();
          } catch (err) {
            Alert.alert('Fejl', err.message);
          }
        }
      }
    ]);
  }

  function renderItem({ item }) {
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => { if (suppressRowPress.current) return; setSelectedMedlem(item); }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{item.fornavn ?? ''} {item.efternavn ?? ''}</Text>
          <Text style={styles.rowSubtitle}>Nr: {item.medlemsnummer ?? ''} — {item.klub?.klubNummer ?? ''}</Text>
          <Text style={styles.rowSmall}>{item.adresse ?? ''} • {item.postnummer ?? ''}</Text>
          <Text style={styles.rowSmall}>{formatDate(item.fodselsdato)} • {formatPhone(item.mobiltelefon)}</Text>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => {
            suppressRowPress.current = true;
            openEditMedlem(item.id);
            setTimeout(() => { suppressRowPress.current = false; }, 150);
          }}
        >
          <Text style={{ color: '#fff' }}>Rediger</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={onBack}>
          <Text style={styles.backText}>← Tilbage</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Medlemmer</Text>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView style={styles.filters} keyboardShouldPersistTaps="handled">
        <View style={styles.rowInput}>
          <TextInput placeholder="Medlemsnummer" style={styles.input} value={filters.medlemsnummer}
            onChangeText={(t)=>setFilters({...filters, medlemsnummer: t})} keyboardType="numeric" />
          <TextInput placeholder="Fornavn" style={styles.input} value={filters.fornavn}
            onChangeText={(t)=>setFilters({...filters, fornavn: t})} />
        </View>
        <View style={styles.rowInput}>
          <TextInput placeholder="Efternavn" style={styles.input} value={filters.efternavn}
            onChangeText={(t)=>setFilters({...filters, efternavn: t})} />
          <TextInput placeholder="Adresse" style={styles.input} value={filters.adresse}
            onChangeText={(t)=>setFilters({...filters, adresse: t})} />
        </View>
        <View style={styles.rowInput}>
          <TextInput placeholder="Postnr." style={styles.input} value={filters.postnummer}
            onChangeText={(t)=>setFilters({...filters, postnummer: t})} keyboardType="numeric" />
          <TextInput placeholder="E‑mail" style={styles.input} value={filters.email}
            onChangeText={(t)=>setFilters({...filters, email: t})} keyboardType="email-address" />
        </View>
        <View style={styles.rowInput}>
          <TextInput placeholder="Fødselsdato (YYYY-MM-DD)" style={styles.input} value={filters.fodselsdato}
            onChangeText={(t)=>setFilters({...filters, fodselsdato: t})} />
          <TextInput placeholder="Mobiltelefon" style={styles.input} value={filters.mobiltelefon}
            onChangeText={(t)=>setFilters({...filters, mobiltelefon: t})} keyboardType="phone-pad" />
        </View>
        <View style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
          <TextInput placeholder="NuvHac" style={styles.input} value={filters.nuvhac}
            onChangeText={(t)=>setFilters({...filters, nuvhac: t})} keyboardType="numeric" />
        </View>
      </ScrollView>

      <Text style={styles.status}>{statusMsg}</Text>

      <FlatList data={list} keyExtractor={(i)=>String(i.id)} renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120 }} style={{ flex: 1, width: '100%' }} />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedMedlem(null)}>
          <Text style={{ color: '#fff' }}>Ryd</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!selectedMedlem} animationType="slide">
        <View style={{ flex: 1 }}>
          <Medlemskab medlem={selectedMedlem} onBack={() => setSelectedMedlem(null)} />
        </View>
      </Modal>

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Rediger Medlem</Text>
              {editMedlem && (
                <>
                  <TextInput style={styles.input} value={String(editMedlem.medlemsnummer ?? '')} editable={false} />
                  <TextInput style={styles.input} placeholder="Fornavn" value={editMedlem.fornavn ?? ''}
                    onChangeText={(t)=>setEditMedlem({...editMedlem, fornavn: t})} />
                  <TextInput style={styles.input} placeholder="Efternavn" value={editMedlem.efternavn ?? ''}
                    onChangeText={(t)=>setEditMedlem({...editMedlem, efternavn: t})} />
                  <TextInput style={styles.input} placeholder="Adresse" value={editMedlem.adresse ?? ''}
                    onChangeText={(t)=>setEditMedlem({...editMedlem, adresse: t})} />
                  <TextInput style={styles.input} placeholder="Postnummer" value={editMedlem.postnummer ?? ''}
                    onChangeText={(t)=>setEditMedlem({...editMedlem, postnummer: t})} keyboardType="numeric" />
                  <TextInput style={styles.input} placeholder="Email" value={editMedlem.email ?? ''}
                    onChangeText={(t)=>setEditMedlem({...editMedlem, email: t})} keyboardType="email-address" />
                  <TextInput style={styles.input} placeholder="Fødselsdato (YYYY-MM-DD)" value={editMedlem.fodselsdato ?? ''}
                    onChangeText={(t)=>setEditMedlem({...editMedlem, fodselsdato: t})} />
                  <TextInput style={styles.input} placeholder="Mobiltelefon" value={editMedlem.mobiltelefon ?? ''}
                    onChangeText={(t)=>setEditMedlem({...editMedlem, mobiltelefon: t})} />
                  <TextInput style={styles.input} placeholder="NuvHac" value={String(editMedlem.nuvhac ?? '')}
                    onChangeText={(t)=>setEditMedlem({...editMedlem, nuvhac: t})} keyboardType="numeric" />
                </>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.button} onPress={saveEditMedlem}>
                  <Text style={styles.buttonText}>Gem</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, { backgroundColor: '#d9534f' }]} onPress={deleteMedlem}>
                  <Text style={styles.buttonText}>Slet</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, { backgroundColor: '#6c757d' }]} onPress={()=>setEditModalVisible(false)}>
                  <Text style={styles.buttonText}>Luk</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 18, alignItems: 'center', backgroundColor: '#0b1220' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'transparent' },
  headerBack: { padding: 6 },
  backText: { color: '#06b6d4', fontSize: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 6, color: '#e6f6f8', textAlign: 'center' },
  filters: { width: '100%', paddingHorizontal: 8, paddingBottom: 6 },
  rowInput: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  input: {
    backgroundColor: '#ffffff',
    color: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 6,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 13,
    height: 40
  },
  row: { flexDirection: 'row', padding: 10, backgroundColor: '#0f172a', marginVertical: 6, marginHorizontal: 8, borderRadius: 10, alignItems: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#e6f6f8' },
  rowSubtitle: { color: '#9fb7bd' },
  rowSmall: { color: '#9fb7bd', fontSize: 12 },
  editBtn: { backgroundColor: '#06b6d4', padding: 8, borderRadius: 6 },
  footer: { position: 'absolute', bottom: 10, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  backBtn: { backgroundColor: '#06b6d4', padding: 10, borderRadius: 6 },
  status: { padding: 6, color: '#9fb7bd' },

  // modal styles aligned with klub popup
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 14, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#062e35' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  button: { backgroundColor: '#06b6d4', padding: 10, borderRadius: 10, alignItems: 'center', marginRight: 8, flex: 1 },
  buttonText: { color: '#062e35', fontWeight: '700' },
});