"use client";

import { useState } from "react";
import Decimal from "decimal.js";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [capital, setCapital] = useState("1000");
  const [tasa, setTasa] = useState("5");
  const [anios, setAnios] = useState("10");

  // Dos valores derivados del estado: el resumen y la serie año a año
  const resultado = calcularInteresCompuesto(capital, tasa, anios);
  const datos = generarDatosAnuales(capital, tasa, anios);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">Calculadora de interés compuesto</h1>

      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Capital inicial ($)</label>
          <Input
            type="number"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Tasa anual (%)</label>
          <Input
            type="number"
            value={tasa}
            onChange={(e) => setTasa(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Años</label>
          <Input
            type="number"
            value={anios}
            onChange={(e) => setAnios(e.target.value)}
          />
        </div>
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Resultado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm text-zinc-600">Capital final:</div>
            <div className="text-3xl font-bold tabular-nums">
              ${resultado.final}
            </div>
            <div className="text-sm text-zinc-600">
              Ganancia:{" "}
              <span className="font-medium text-green-600">
                +${resultado.ganancia}
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={datos}
                margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="anio"
                  label={{ value: "Año", position: "insideBottom", offset: -4 }}
                />
                <YAxis
                  tickFormatter={(v: number) =>
                    `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    `$${Number(value).toFixed(2)}`,
                    "Capital",
                  ]}
                  labelFormatter={(label) => `Año ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function calcularInteresCompuesto(
  capital: string,
  tasa: string,
  anios: string,
) {
  try {
    const p = new Decimal(capital || "0");
    const r = new Decimal(tasa || "0").div(100);
    const t = new Decimal(anios || "0");
    const final = p.mul(new Decimal(1).plus(r).pow(t));
    const ganancia = final.minus(p);
    return {
      final: final.toFixed(2),
      ganancia: ganancia.toFixed(2),
    };
  } catch {
    return { final: "0.00", ganancia: "0.00" };
  }
}

function generarDatosAnuales(capital: string, tasa: string, anios: string) {
  try {
    const p = new Decimal(capital || "0");
    const r = new Decimal(tasa || "0").div(100);
    const t = Math.max(0, Math.min(100, parseInt(anios || "0", 10)));
    return Array.from({ length: t + 1 }, (_, i) => {
      const valor = p.mul(new Decimal(1).plus(r).pow(i));
      return {
        anio: i,
        valor: parseFloat(valor.toFixed(2)),
      };
    });
  } catch {
    return [];
  }
}
