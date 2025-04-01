import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../pantallas/Login";
import Registro from "../pantallas/Registro";
import Inicio from "../pantallas/Inicio";
import CrearRecibo from "../pantallas/CrearRecibo";
import { RootStackParamList } from "../types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function NavegacionPrincipal() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Registro" component={Registro} />
      <Stack.Screen name="Inicio" component={Inicio} />
      <Stack.Screen name="CrearRecibo" component={CrearRecibo} />
    </Stack.Navigator>
  );
}
