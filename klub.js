import React, { Component } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';


export const API_BASE = "http://10.136.130.188:8080";
const API_URL = `${API_BASE}/api/klub`;

export default class Klub extends Component {
  constructor(props) {
    super(props);
    this.state = {
      klubNummer: '',
      klubNavn: '',
      klubType: '',
      spillested: '',
      adresse: '',
      mobilnummer: '',
      email: '',

      klubber: [],
      members: [],
      loading: false,
      status: '',
      modalVisible: false,
      selectedKlub: null,
      showingMembersFor: null,

      formNummer: '',
      formNavn: '',
      formType: '',
      formSpillested: '',
      formAdresse: '',
      formMobil: '',
      formEmail: '',
    };

    this.searchTimer = null;
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    // initial fetch can be triggered manually by user; optionally fetch all:
    // this.fetchKlubber(true);
  }

  componentDidUpdate(prevProps, prevState) {
    const keys = ['klubNummer','klubNavn','klubType','spillested','adresse','mobilnummer','email'];
    const changed = keys.some(k => prevState[k] !== this.state[k]);
    if (changed) {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        if (this.hasAnySearch()) this.fetchKlubber(true);
      }, 350);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  hasAnySearch = () => {
    const s = this.state;
    return (
      s.klubNummer.trim() !== '' ||
      s.klubNavn.trim() !== '' ||
      s.klubType.trim() !== '' ||
      s.spillested.trim() !== '' ||
      s.adresse.trim() !== '' ||
      s.mobilnummer.trim() !== '' ||
      s.email.trim() !== ''
    );
  };

  setStatus = (msg) => {
    if (!this._isMounted) return;
    this.setState({ status: msg });
  };

  fetchKlubber = async (force = true) => {
    this.setState({ loading: true, status: 'Fetching clubs...' });
    try {
      const params = new URLSearchParams();
      const s = this.state;
      if (s.klubNummer.trim()) params.append('klubNummer', s.klubNummer.trim());
      if (s.klubNavn.trim()) params.append('navn', s.klubNavn.trim());
      if (s.klubType.trim()) params.append('klubType', s.klubType.trim());
      if (s.spillested.trim()) params.append('spillested', s.spillested.trim());
      if (s.adresse.trim()) params.append('adresse', s.adresse.trim());
      if (s.mobilnummer.trim()) params.append('mobilnummer', s.mobilnummer.trim());
      if (s.email.trim()) params.append('email', s.email.trim());

      const qs = params.toString();
      const url = `${API_URL}/search${qs ? '?' + qs : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (!this._isMounted) return;
      this.setState({ klubber: Array.isArray(data) ? data : [], status: `Found ${Array.isArray(data) ? data.length : 0} clubs`, showingMembersFor: null, members: [] });
    } catch (err) {
      if (!this._isMounted) return;
      this.setState({ klubber: [], status: 'Could not fetch clubs: ' + err.message });
    } finally {
      if (this._isMounted) this.setState({ loading: false });
    }
  };

  fetchMembersFor = async (klubId) => {
    this.setState({ loading: true, status: 'Fetching members...' });
    try {
      let res = await fetch(`${API_URL}/${encodeURIComponent(klubId)}/medlemskaber`);
      if (res.status === 404) {
        res = await fetch(`${API_URL}/nummer/${encodeURIComponent(klubId)}/medlemskaber`);
      }
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (!this._isMounted) return;
      this.setState({ members: Array.isArray(data) ? data : [], showingMembersFor: klubId, status: `Showing ${Array.isArray(data) ? data.length : 0} members` });
    } catch (err) {
      if (!this._isMounted) return;
      this.setState({ members: [], status: 'Could not fetch members: ' + err.message });
    } finally {
      if (this._isMounted) this.setState({ loading: false });
    }
  };

  openCreateModal = () => {
    this.setState({
      selectedKlub: null,
      formNummer: '',
      formNavn: '',
      formType: '',
      formSpillested: '',
      formAdresse: '',
      formMobil: '',
      formEmail: '',
      modalVisible: true,
    });
  };

  openEditModal = (klub) => {
    this.setState({
      selectedKlub: klub,
      formNummer: klub.klubNummer ? String(klub.klubNummer) : '',
      formNavn: klub.klubNavn || '',
      formType: klub.klubType ? String(klub.klubType) : '',
      formSpillested: klub.spillested || '',
      formAdresse: klub.adresse || '',
      formMobil: klub.mobilnummer || '',
      formEmail: klub.email || '',
      modalVisible: true,
    });
  };

  saveKlub = async () => {
    const s = this.state;
    this.setState({ loading: true, status: s.selectedKlub ? 'Updating club...' : 'Creating club...' });
    try {
      const klubData = {
        ...(s.formNummer ? { klubNummer: Number(s.formNummer) } : {}),
        klubNavn: s.formNavn || null,
        klubType: s.formType ? Number(s.formType) : 0,
        spillested: s.formSpillested || null,
        adresse: s.formAdresse || null,
        mobilnummer: s.formMobil || null,
        email: s.formEmail || null,
      };

      let url = API_URL;
      let method = 'POST';
      if (s.selectedKlub && (s.selectedKlub.id || s.selectedKlub.klubNummer)) {
        const id = s.selectedKlub.id ?? s.selectedKlub.klubNummer;
        if (id) {
          url = `${API_URL}/${id}`;
          method = 'PUT';
        }
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(klubData),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text}`);
      }

      if (!this._isMounted) return;
      this.setState({ modalVisible: false });
      this.fetchKlubber(true);
      this.setStatus('Saved club');
    } catch (err) {
      Alert.alert('Error', 'Could not save club: ' + err.message);
      if (this._isMounted) this.setState({ status: 'Could not save club' });
    } finally {
      if (this._isMounted) this.setState({ loading: false });
    }
  };

  deleteKlub = () => {
    const { selectedKlub } = this.state;
    if (!selectedKlub) return;
    Alert.alert('Confirm', `Delete club ${selectedKlub.klubNavn || selectedKlub.klubNummer}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!this._isMounted) return;
          this.setState({ loading: true, status: 'Deleting club...' });
          try {
            const id = selectedKlub.id ?? selectedKlub.klubNummer;
            if (!id) throw new Error('Could not resolve id');
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`Error ${res.status}`);
            if (!this._isMounted) return;
            this.setState({ modalVisible: false });
            this.fetchKlubber(true);
            this.setStatus('Club deleted');
          } catch (err) {
            Alert.alert('Error', 'Could not delete club: ' + err.message);
            if (this._isMounted) this.setState({ status: 'Could not delete club' });
          } finally {
            if (this._isMounted) this.setState({ loading: false });
          }
        },
      },
    ]);
  };

  renderClubItem = ({ item }) => {
    const idAttr = item.id ?? item.klubNummer ?? '';
    return (
      <View style={styles.clubRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.clubTitle}>{item.klubNavn || '-'}</Text>
          <Text style={styles.clubMeta}>
            #{item.klubNummer ?? '-'} • {item.klubType ?? '-'} • {item.spillested ?? '-'}
          </Text>
        </View>
        <View style={styles.rowButtons}>
          <TouchableOpacity style={styles.smallBtn} onPress={() => this.fetchMembersFor(idAttr)}>
            <Text style={styles.smallBtnText}>Medlemmer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallBtn} onPress={() => this.openEditModal(item)}>
            <Text style={styles.smallBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  renderMemberItem = ({ item }) => {
    const m = item.medlem ?? item.member ?? item;
    const medlemsnummer = m.medlemsnummer ?? m.medlemsNummer ?? m.id ?? '';
    const fornavn = m.fornavn ?? m.firstName ?? '';
    const efternavn = m.efternavn ?? m.lastName ?? '';
    const mail = m.email ?? m.e_mail ?? '';
    const mobil = m.mobiltelefon ?? m.mobil ?? '';
    const type = item.type ?? item.medlemskabType ?? item.medlemskabstype ?? '';
    const pris = item.pris ?? item.price ?? '';

    return (
      <View style={styles.memberRow}>
        <Text style={styles.memberText}>
          {medlemsnummer} — {fornavn} {efternavn}
        </Text>
        <Text style={styles.memberMeta}>
          {mail} • {mobil} • {type} {pris ? `• ${pris}` : ''}
        </Text>
      </View>
    );
  };

  render() {
    const s = this.state;
    const { onBack } = this.props;

    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Tilbage</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Klubber</Text>
        </View>

        {!s.showingMembersFor ? (
          <FlatList
            data={s.klubber}
            keyExtractor={(item, idx) => String(item.id ?? item.klubNummer ?? idx)}
            renderItem={this.renderClubItem}
            ListHeaderComponent={
              <View style={styles.searchSection}>
                <Text style={styles.label}>Søgning</Text>

                <View style={styles.row}>
                  <TextInput placeholder="Klub Nummer" value={s.klubNummer} onChangeText={(v) => this.setState({ klubNummer: v })} style={styles.input} keyboardType="numeric" />
                  <TextInput placeholder="Navn" value={s.klubNavn} onChangeText={(v) => this.setState({ klubNavn: v })} style={styles.input} />
                </View>

                <View style={styles.row}>
                  <TextInput placeholder="Type" value={s.klubType} onChangeText={(v) => this.setState({ klubType: v })} style={styles.input} />
                  <TextInput placeholder="Spillested" value={s.spillested} onChangeText={(v) => this.setState({ spillested: v })} style={styles.input} />
                </View>

                <View style={styles.row}>
                  <TextInput placeholder="Adresse" value={s.adresse} onChangeText={(v) => this.setState({ adresse: v })} style={styles.input} />
                  <TextInput placeholder="Mobil" value={s.mobilnummer} onChangeText={(v) => this.setState({ mobilnummer: v })} style={styles.input} keyboardType="phone-pad" />
                </View>

                <View style={styles.row}>
                  <TextInput placeholder="Email" value={s.email} onChangeText={(v) => this.setState({ email: v })} style={styles.input} keyboardType="email-address" />
                </View>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity style={styles.button} onPress={this.openCreateModal}>
                    <Text style={styles.buttonText}>Opret ny klub</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.button} onPress={() => this.fetchKlubber(true)}>
                    <Text style={styles.buttonText}>Opdatér</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.status}>{s.status}</Text>
                {s.loading && <ActivityIndicator style={{ marginVertical: 8 }} />}
              </View>
            }
            contentContainerStyle={{ paddingBottom: 80 }}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 12 }}>Ingen klubber</Text>}
          />
        ) : (
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 12 }}>
              <TouchableOpacity
                style={[styles.button, { marginVertical: 8 }]}
                onPress={() => {
                  this.setState({ showingMembersFor: null, members: [] }, () => this.fetchKlubber(true));
                }}
              >
                <Text style={styles.buttonText}>Tilbage til klubber</Text>
              </TouchableOpacity>
              <Text style={styles.status}>{s.status}</Text>
              {s.loading && <ActivityIndicator style={{ marginVertical: 8 }} />}
            </View>

            <FlatList
              data={s.members}
              keyExtractor={(_, i) => String(i)}
              renderItem={this.renderMemberItem}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 12 }}>Ingen medlemmer</Text>}
              contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 12 }}
            />
          </View>
        )}

        <Modal visible={s.modalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>{s.selectedKlub ? 'Opdater klub' : 'Opret ny klub'}</Text>

                <TextInput placeholder="Klub Nummer" value={s.formNummer} onChangeText={(v) => this.setState({ formNummer: v })} style={styles.input} keyboardType="numeric" />
                <TextInput placeholder="Navn" value={s.formNavn} onChangeText={(v) => this.setState({ formNavn: v })} style={styles.input} />
                <TextInput placeholder="Type" value={s.formType} onChangeText={(v) => this.setState({ formType: v })} style={styles.input} />
                <TextInput placeholder="Spillested" value={s.formSpillested} onChangeText={(v) => this.setState({ formSpillested: v })} style={styles.input} />
                <TextInput placeholder="Adresse" value={s.formAdresse} onChangeText={(v) => this.setState({ formAdresse: v })} style={styles.input} />
                <TextInput placeholder="Mobil" value={s.formMobil} onChangeText={(v) => this.setState({ formMobil: v })} style={styles.input} keyboardType="phone-pad" />
                <TextInput placeholder="Email" value={s.formEmail} onChangeText={(v) => this.setState({ formEmail: v })} style={styles.input} keyboardType="email-address" />

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.button} onPress={this.saveKlub}>
                    <Text style={styles.buttonText}>{s.selectedKlub ? 'Opdater' : 'Gem'}</Text>
                  </TouchableOpacity>

                  {s.selectedKlub && (
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#d9534f' }]} onPress={this.deleteKlub}>
                      <Text style={styles.buttonText}>Slet</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={[styles.button, { backgroundColor: '#6c757d' }]} onPress={() => this.setState({ modalVisible: false })}>
                    <Text style={styles.buttonText}>Luk</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 8, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 12 },
  backBtn: { padding: 6 },
  backText: { color: '#007AFF', fontSize: 16 },
  title: { fontSize: 20, fontWeight: '600', marginLeft: 8 },
  searchSection: { paddingHorizontal: 12, paddingBottom: 8 },
  form: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600', marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 6,
    marginRight: 8,
  },
  buttonGroup: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  button: { backgroundColor: '#007AFF', padding: 10, borderRadius: 6, alignItems: 'center', marginRight: 8 },
  buttonText: { color: '#fff' },
  status: { marginTop: 6, color: '#666', paddingHorizontal: 12 },
  clubRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center', paddingHorizontal: 12 },
  clubTitle: { fontSize: 16, fontWeight: '600' },
  clubMeta: { color: '#666', fontSize: 12 },
  rowButtons: { flexDirection: 'column', marginLeft: 8 },
  smallBtn: { backgroundColor: '#0a84ff', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 4, marginBottom: 6 },
  smallBtnText: { color: '#fff', fontSize: 12 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 8, padding: 12, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  memberRow: { padding: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  memberText: { fontWeight: '600' },
  memberMeta: { color: '#666', fontSize: 12 },
});