import React from "react";
import { View, Text, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";

type NavigationProp = StackNavigationProp<RootStackParamList, "Inicio">;

export default function Inicio() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}> BIENVENIDO  </Text>
      <Button title="Ir a Crear Recibo" onPress={() => navigation.navigate("CrearRecibo")} />
    </View>
  );
}

