import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../servicios/firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";

type NavigationProp = StackNavigationProp<RootStackParamList, "Login">;

export default function Login() {
  const navigation = useNavigation<NavigationProp>();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");

  const ingresar = async () => {
    try {
      await signInWithEmailAndPassword(auth, correo, clave);
      navigation.navigate("Inicio");
    } catch (error: any) {
      Alert.alert("Error", "Correo o contraseña incorrectos.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Iniciar Sesión</Text>

      <TextInput
        placeholder="Correo electrónico"
        value={correo}
        onChangeText={setCorreo}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Contraseña"
        value={clave}
        onChangeText={setClave}
        style={styles.input}
        secureTextEntry
      />

      <Button title="INGRESAR" onPress={ingresar} color="#2196F3" />
      <View style={{ marginTop: 10 }} />
      <Button title="Crear Usuario" onPress={() => navigation.navigate("Registro")} color="green" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 20,
    padding: 10,
  },
});
