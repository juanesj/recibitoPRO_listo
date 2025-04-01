import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../servicios/firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";

type NavigationProp = StackNavigationProp<RootStackParamList, "Registro">;

export default function Registro() {
  const navigation = useNavigation<NavigationProp>();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");

  const registrar = async () => {
    if (!correo.includes("@") || clave.length < 6) {
      Alert.alert("Datos inválidos", "Revisa tu correo y contraseña.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, correo, clave);
      Alert.alert("Usuario creado", "Ahora puedes iniciar sesión.");
      navigation.navigate("Login"); // 👈 Lo lleva al login
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Crear Cuenta</Text>

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

      <Button title="Registrar" onPress={registrar} />
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
