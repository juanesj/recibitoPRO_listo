import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, ScrollView, Alert } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../servicios/firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import { RootStackParamList } from "../types/navigation";

type NavigationProp = StackNavigationProp<RootStackParamList, "CrearRecibo">;

export default function CrearRecibo() {
  const navigation = useNavigation<NavigationProp>();

  const [cliente, setCliente] = useState("");
  const [vehiculo, setVehiculo] = useState("");
  const [placa, setPlaca] = useState("");
  const [vin, setVin] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [monto, setMonto] = useState("");
  const [formaPago, setFormaPago] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [numeroRecibo, setNumeroRecibo] = useState("");

  useEffect(() => {
    const generarNumero = () => {
      const now = new Date();
      const timestamp = now.getTime();
      setNumeroRecibo("REC-" + timestamp.toString().slice(-6));
    };
    generarNumero();
  }, []);

  const generarPDF = async () => {
    const fecha = new Date().toLocaleDateString();

    const logoAsset = Asset.fromModule(require("../assets/logo_autoventas.png"));
    await logoAsset.downloadAsync();
    const logoUri = logoAsset.localUri || "";

    const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4;
            margin: 0;
          }
  
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
          }
  
          body {
            font-family: Arial, sans-serif;
            font-size: 16px;
          }
  
          .container {
            width: 210mm;
            height: 297mm;
            padding: 30mm;
            box-sizing: border-box;
          }
  
          h1 {
            text-align: center;
            font-size: 24pt;
            margin-bottom: 20px;
          }
  
          img {
            width: 140px;
            display: block;
            margin: 0 auto 20px auto;
          }
  
          .campo {
            margin-bottom: 10px;
            font-size: 14pt;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>RECIBO DE PAGO</h1>
          <img src="${logoUri}" />
          <div class="campo"><strong>Fecha:</strong> ${fecha}</div>
          <div class="campo"><strong>Número de Recibo:</strong> ${numeroRecibo}</div>
          <div class="campo"><strong>Cliente:</strong> ${cliente}</div>
          <div class="campo"><strong>Vehículo:</strong> ${vehiculo}</div>
          <div class="campo"><strong>Placa:</strong> ${placa}</div>
          <div class="campo"><strong>VIN:</strong> ${vin}</div>
          <div class="campo"><strong>Vendedor:</strong> ${vendedor}</div>
          <div class="campo"><strong>Monto:</strong> Q ${monto}</div>
          <div class="campo"><strong>Forma de Pago:</strong> ${formaPago}</div>
          <div class="campo"><strong>Observaciones:</strong> ${observaciones}</div>
        </div>
      </body>
    </html>
  `;
  


    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 595.28,
      height: 841.89
    });

    await Sharing.shareAsync(uri);
  };

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
      limpiarCampos();
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar sesión");
    }
  };

  const limpiarCampos = () => {
    setCliente("");
    setVehiculo("");
    setPlaca("");
    setVin("");
    setVendedor("");
    setMonto("");
    setFormaPago("");
    setObservaciones("");
    setNumeroRecibo("");
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Nuevo Recibo</Text>

      <TextInput placeholder="Cliente" value={cliente} onChangeText={setCliente} />
      <TextInput placeholder="Vehículo" value={vehiculo} onChangeText={setVehiculo} />
      <TextInput placeholder="Placa" value={placa} onChangeText={setPlaca} />
      <TextInput placeholder="VIN" value={vin} onChangeText={setVin} />
      <TextInput placeholder="Vendedor" value={vendedor} onChangeText={setVendedor} />
      <TextInput placeholder="Monto" value={monto} onChangeText={setMonto} keyboardType="numeric" />
      <TextInput placeholder="Forma de Pago" value={formaPago} onChangeText={setFormaPago} />
      <TextInput placeholder="Observaciones" value={observaciones} onChangeText={setObservaciones} />
      <TextInput placeholder="Número de Recibo" value={numeroRecibo} editable={false} />

      <Button title="Generar Recibo" onPress={generarPDF} />
      <Button title="Cerrar Sesión" onPress={cerrarSesion} color="red" />
    </ScrollView>
  );
}

