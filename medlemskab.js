import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert, StyleSheet, ScrollView
} from 'react-native';

export const API_BASE = "http://10.136.130.188:8080";
const API_URL = `${API_BASE}/api/medlemskaber`;

// parse Danish/text statuses to integer
function getMedlemsstatusAsInteger(value) {
  if (value === null || value === undefined) return NaN;
  if (typeof value === 'number' && Number.isInteger(value)) return value;

  const s = String(value).trim().toLowerCase();
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);

  const normalized = s
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  switch (normalized) {
    case "klubmedlem":
    case "klub":
    case "aktiv":
      return 1;
    case "primar":
    case "primaer":
    case "primær":
    case "primary":
    case "passiv":
      return 2;
    case "udmeldt":
    case "cancelled":
      return 3;
    default:
      return NaN;
  }
}

export default function Medlemskab({ medlem, onBack = () => {} }) {
  const [list, setList] = useState([]);
  const [status, setStatus] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    klub: '', medlemsstatus: '', startdato: '', slutdato: '', pris: '', primaryKlub: false
  });

  useEffect(() => {
    if (medlem && medlem.id !== undefined) fetchForMedlem(medlem.id);
    else {
      setList([]);
      setStatus('');
    }
  }, [medlem]);

  async function fetchForMedlem(medlemId) {
    setStatus('Henter medlemskaber...');
    setList([]);
    if (!medlemId) {
      setStatus('Vælg et medlem');
      return;
    }
    const candidates = [
      `${API_URL}/medlem/${medlemId}`,
      `${API_URL}/search?medlemId=${medlemId}`,
      `${API_URL}?medlemId=${medlemId}`,
      `${API_URL}/member/${medlemId}`
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const json = await res.json();
        if (Array.isArray(json)) {
          setList(json);
          setStatus(`Viser ${json.length} medlemskaber`);
          return;
        }
        if (json && Array.isArray(json.content)) {
          setList(json.content);
          setStatus(`Viser ${json.content.length} medlemskaber`);
          return;
        }
      } catch (e) {
        // try next
      }
    }
    // fallback generic list then client filter
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          const filtered = json.filter(m => String(m.medlem?.id) === String(medlemId));
          setList(filtered);
          setStatus(`Viser ${filtered.length} medlemskaber (filtreret)`);
          return;
        }
      }
    } catch (e) { /* ignore */ }
    setStatus('Kunne ikke hente medlemskaber');
  }

  function resetForm() {
    setForm({ klub: '', medlemsstatus: '', startdato: '', slutdato: '', pris: '', primaryKlub: false });
  }

  async function createMedlemskab() {
    if (!medlem) return setStatus('Vælg et medlem først');
    const klubId = parseInt(form.klub, 10);
    if (isNaN(klubId)) return setStatus('Klub skal være et gyldigt nummer');
    const statusInt = getMedlemsstatusAsInteger(form.medlemsstatus) || 1;
    const payload = {
      medlem: { id: Number(medlem.id) },
      klub: { id: klubId },
      medlemsstatus: statusInt,
      startdato: form.startdato || null,
      slutdato: form.slutdato || null,
      pris: parseFloat(form.pris) || 0,
      primaryKlub: !!form.primaryKlub
    };
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Fejl ved oprettelse');
      }
      setCreateVisible(false);
      resetForm();
      fetchForMedlem(medlem.id);
    } catch (err) {
      setStatus('Fejl ved oprettelse: ' + err.message);
    }
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({
      klub: item.klub?.id ?? item.klub?.klubNummer ?? '',
      medlemsstatus: String(item.medlemsstatus ?? ''),
      startdato: item.startdato ?? '',
      slutdato: item.slutdato ?? '',
      pris: item.pris != null ? String(item.pris) : '',
      primaryKlub: !!item.primaryKlub
    });
    setEditVisible(true);
  }

  async function saveEdit() {
    if (!editItem) return;
    const klubId = parseInt(form.klub, 10);
    if (isNaN(klubId)) return setStatus('Klub skal være et gyldigt nummer');
    const statusInt = getMedlemsstatusAsInteger(form.medlemsstatus) || editItem.medlemsstatus;
    const updated = {
      id: editItem.id,
      klub: { id: klubId },
      medlem: { id: medlem.id },
      medlemsstatus: statusInt,
      startdato: form.startdato || null,
      slutdato: form.slutdato || null,
      pris: parseFloat(form.pris) || 0,
      primaryKlub: !!form.primaryKlub
    };
    try {
      const res = await fetch(`${API_URL}/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Fejl ved opdatering');
      }
      setEditVisible(false);
      fetchForMedlem(medlem.id);
    } catch (err) {
      setStatus('Fejl ved opdatering: ' + err.message);
    }
  }

  function confirmDelete(item) {
    Alert.alert('Slet medlemskab', 'Er du sikker?', [
      { text: 'Annuller', style: 'cancel' },
      { text: 'Slet', style: 'destructive', onPress: () => deleteItem(item) }
    ]);
  }

  async function deleteItem(item) {
    try {
      const res = await fetch(`${API_URL}/${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Fejl ved sletning');
      }
      fetchForMedlem(medlem.id);
    } catch (err) {
      setStatus('Fejl ved sletning: ' + err.message);
    }
  }

  function renderItem({ item }) {
    const klubLabel = (item.klub && (item.klub.klubNavn || item.klub.klubNummer))
      ? `${item.klub.klubNavn ?? ''} ${item.klub.klubNummer ? '(' + item.klub.klubNummer + ')' : ''}`
      : (item.klub?.id ?? '');
    const primary = item.primaryKlub ? 'Ja' : 'Nej';
    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{klubLabel}</Text>
          <Text>Status: {String(item.medlemsstatus)}</Text>
          <Text>Primær: {primary} • Start: {item.startdato ?? ''} • Slut: {item.slutdato ?? ''}</Text>
          <Text>Pris: {item.pris ?? ''} • Saldo: {item.saldo ?? ''}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.smallBtn} onPress={() => openEdit(item)}><Text style={styles.btnText}>Rediger</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.smallBtn, styles.deleteBtn]} onPress={() => confirmDelete(item)}><Text style={styles.btnText}>Slet</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>Tilbage</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Medlemskaber — {medlem?.fornavn ?? ''} {medlem?.efternavn ?? ''}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.status}>{status}</Text>

        <TouchableOpacity style={styles.createBtn} onPress={() => { resetForm(); setCreateVisible(true); }}>
          <Text style={styles.createBtnText}>Opret Medlemskab</Text>
        </TouchableOpacity>

        <FlatList
          data={list}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{ padding: 12 }}>Ingen medlemskaber fundet.</Text>}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      </View>

      <Modal visible={createVisible} animationType="slide" transparent>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>Opret Medlemskab</Text>
              <TextInput placeholder="Klub (nummer)" style={styles.input} value={form.klub} onChangeText={(t) => setForm({ ...form, klub: t })} keyboardType="numeric" />
              <TextInput placeholder="Medlemsstatus" style={styles.input} value={form.medlemsstatus} onChangeText={(t) => setForm({ ...form, medlemsstatus: t })} />
              <TextInput placeholder="Startdato (YYYY-MM-DD)" style={styles.input} value={form.startdato} onChangeText={(t) => setForm({ ...form, startdato: t })} />
              <TextInput placeholder="Slutdato (YYYY-MM-DD)" style={styles.input} value={form.slutdato} onChangeText={(t) => setForm({ ...form, slutdato: t })} />
              <TextInput placeholder="Pris" style={styles.input} value={form.pris} onChangeText={(t) => setForm({ ...form, pris: t })} keyboardType="numeric" />
              <View style={styles.checkboxRow}>
                <TouchableOpacity onPress={() => setForm({ ...form, primaryKlub: !form.primaryKlub })} style={[styles.checkbox, form.primaryKlub && styles.checkboxChecked]}>
                  <Text>{form.primaryKlub ? '✓' : ''}</Text>
                </TouchableOpacity>
                <Text style={{ marginLeft: 8 }}>Primærklub</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.saveBtn} onPress={createMedlemskab}><Text style={styles.btnText}>Gem</Text></TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateVisible(false)}><Text>Annuler</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>Rediger Medlemskab</Text>
              <TextInput placeholder="Klub (nummer)" style={styles.input} value={form.klub} onChangeText={(t) => setForm({ ...form, klub: t })} keyboardType="numeric" />
              <TextInput placeholder="Medlemsstatus" style={styles.input} value={form.medlemsstatus} onChangeText={(t) => setForm({ ...form, medlemsstatus: t })} />
              <TextInput placeholder="Startdato" style={styles.input} value={form.startdato} onChangeText={(t) => setForm({ ...form, startdato: t })} />
              <TextInput placeholder="Slutdato" style={styles.input} value={form.slutdato} onChangeText={(t) => setForm({ ...form, slutdato: t })} />
              <TextInput placeholder="Pris" style={styles.input} value={form.pris} onChangeText={(t) => setForm({ ...form, pris: t })} keyboardType="numeric" />
              <View style={styles.checkboxRow}>
                <TouchableOpacity onPress={() => setForm({ ...form, primaryKlub: !form.primaryKlub })} style={[styles.checkbox, form.primaryKlub && styles.checkboxChecked]}>
                  <Text>{form.primaryKlub ? '✓' : ''}</Text>
                </TouchableOpacity>
                <Text style={{ marginLeft: 8 }}>Primærklub</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}><Text style={styles.btnText}>Gem ændringer</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, styles.deleteBtn]} onPress={() => { if (editItem) confirmDelete(editItem); setEditVisible(false); }}><Text style={styles.btnText}>Slet</Text></TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditVisible(false)}><Text>Annuler</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  back: { color: '#007AFF' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  container: { flex: 1, padding: 12 },
  status: { marginBottom: 8, color: '#444' },
  createBtn: { backgroundColor: '#007AFF', padding: 10, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
  createBtnText: { color: '#fff' },
  row: { flexDirection: 'row', padding: 12, marginVertical: 6, backgroundColor: '#fff', borderRadius: 8, alignItems: 'center' },
  title: { fontWeight: '700', marginBottom: 4 },
  actions: { justifyContent: 'space-between' },
  smallBtn: { backgroundColor: '#007AFF', padding: 8, borderRadius: 6, marginVertical: 4 },
  deleteBtn: { backgroundColor: '#D9534F' },
  btnText: { color: '#fff' },

  modalWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: { width: '92%', maxHeight: '90%', backgroundColor: '#fff', borderRadius: 8, padding: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#f5f5f5', padding: 8, borderRadius: 6, marginVertical: 6 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  checkbox: { width: 28, height: 28, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  checkboxChecked: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  saveBtn: { backgroundColor: '#007AFF', padding: 10, borderRadius: 6 },
  cancelBtn: { backgroundColor: '#eee', padding: 10, borderRadius: 6 }
});