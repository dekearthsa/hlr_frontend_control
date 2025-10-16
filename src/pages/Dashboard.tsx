import { useMemo, useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
// import type { ApexOptions } from "apexcharts";
// import axios from "axios";
// import useSWR from "swr";

// const HTTP_API = "http://localhost:3011";

// interface typeNewestIAQ {
//   id: number;
//   sensor_id: string;
//   dateTime: number;
//   co2: number;
//   humidity: number;
//   temperature: number;
//   mode: string;
// }

const Dashboard = () => {
  // ── Mock data
  const [isNewestIAQ, setNewestIAQ] = useState<any[]>();
  const [isMode, setIsMode] = useState("idle");
  const [iaq, setIaq] = useState<any[]>([]);
  const [isSystemRunning, setIsSystemRunning] = useState(false);

  const getLastestIAQData = async (data: any) => {
    // console.log("data =>. ", data);
    const arraySensor1 = [];
    const arraySensor2 = [];
    const arraySensor3 = [];
    const arraySensor4 = [];
    for (const el of data) {
      if (el.sensor_id === "1") {
        const payload = {
          id: el.id,
          label: "Calibrate",
          sensor_id: el.sensor_id,
          datetime: el.datetime,
          co2: el.co2,
          temperature: el.temperature,
          humidity: el.humidity,
        };
        arraySensor1.push(payload);
      } else if (el.sensor_id === "2") {
        const payload = {
          id: el.id,
          label: "Outlet",
          sensor_id: el.sensor_id,
          datetime: el.datetime,
          co2: el.co2,
          temperature: el.temperature,
          humidity: el.humidity,
        };
        arraySensor2.push(payload);
      } else if (el.sensor_id === "3") {
        const payload = {
          id: el.id,
          label: "Inlet",
          sensor_id: el.sensor_id,
          datetime: el.datetime,
          co2: el.co2,
          temperature: el.temperature,
          humidity: el.humidity,
        };
        arraySensor3.push(payload);
      } else if (el.sensor_id === "4") {
        const payload = {
          id: el.id,
          label: "Regen",
          sensor_id: el.sensor_id,
          datetime: el.datetime,
          co2: el.co2,
          temperature: el.temperature,
          humidity: el.humidity,
        };
        arraySensor4.push(payload);
      }
    }
    // console.log("arraySensor2 => ", arraySensor2);
    const latest1 =
      arraySensor1.length > 0
        ? arraySensor1[arraySensor1.length - 1]
        : {
            id: "-",
            sensor_id: 0,
            dateTime: 0,
            co2: 0,
            humidity: 0,
            temperature: 0,
            mode: "",
          };
    const latest2 =
      arraySensor2.length > 0
        ? arraySensor2[arraySensor2.length - 1]
        : {
            id: "-",
            sensor_id: 0,
            dateTime: 0,
            co2: 0,
            humidity: 0,
            temperature: 0,
            mode: "",
          };
    const latest3 =
      arraySensor3.length > 0
        ? arraySensor3[arraySensor3.length - 1]
        : {
            id: "-",
            sensor_id: 0,
            dateTime: 0,
            co2: 0,
            humidity: 0,
            temperature: 0,
            mode: "",
          };
    const latest4 =
      arraySensor4.length > 0
        ? arraySensor4[arraySensor4.length - 1]
        : {
            id: "-",
            sensor_id: 0,
            dateTime: 0,
            co2: 0,
            humidity: 0,
            temperature: 0,
            mode: "",
          };
    // console.log("latest1 => ", latest1);
    const arrayData = [latest1, latest2, latest3, latest4];
    // console.log("arrayData => ", arrayData);
    setNewestIAQ(arrayData);
  };

  const fetchFristTime = async () => {
    // const ms = Date.now();
    // const start_ms = 1760498549826;
    // const payload = {
    //   start: start_ms,
    //   lastTimestamp: 0,
    //   firstTime: true,
    // };
    // console.log(payload);
    // const hlrData = await axios.post(`${HTTP_API}/loop/data/iaq`, payload);
    // console.log("hlrData => ", hlrData.data);
    // setIaq(hlrData.data);

    const debug_data = [
      {
        id: 1,
        datetime: 1760498549826,
        sensor_id: "2",
        co2: 450.44,
        temperature: 21.97,
        humidity: 49.83,
        mode: "test",
      },
      {
        id: 2,
        datetime: 1760498549828,
        sensor_id: "3",
        co2: 399.82,
        temperature: 22.05,
        humidity: 50.2,
        mode: "test",
      },
      {
        id: 3,
        datetime: 1760498549829,
        sensor_id: "2",
        co2: 449.79,
        temperature: 22,
        humidity: 49.91,
        mode: "test",
      },
      {
        id: 4,
        datetime: 1760498549830,
        sensor_id: "3",
        co2: 399.64,
        temperature: 21.96,
        humidity: 49.99,
        mode: "test",
      },
      {
        id: 5,
        datetime: 1760498553948,
        sensor_id: "2",
        co2: 450.2,
        temperature: 22.04,
        humidity: 50.06,
        mode: "test",
      },
      {
        id: 6,
        datetime: 1760498553949,
        sensor_id: "3",
        co2: 399.81,
        temperature: 22.04,
        humidity: 49.94,
        mode: "test",
      },
      {
        id: 7,
        datetime: 1760498553950,
        sensor_id: "2",
        co2: 450.51,
        temperature: 22.03,
        humidity: 50.2,
        mode: "test",
      },
      {
        id: 8,
        datetime: 1760498553951,
        sensor_id: "3",
        co2: 399.48,
        temperature: 22.02,
        humidity: 49.8,
        mode: "test",
      },
      {
        id: 9,
        datetime: 1760498558101,
        sensor_id: "2",
        co2: 449.98,
        temperature: 22.01,
        humidity: 49.84,
        mode: "test",
      },
      {
        id: 10,
        datetime: 1760498558103,
        sensor_id: "3",
        co2: 399.64,
        temperature: 22.02,
        humidity: 49.96,
        mode: "test",
      },
      {
        id: 11,
        datetime: 1760498558104,
        sensor_id: "2",
        co2: 450.04,
        temperature: 22,
        humidity: 50.09,
        mode: "test",
      },
      {
        id: 12,
        datetime: 1760498558106,
        sensor_id: "3",
        co2: 399.74,
        temperature: 21.99,
        humidity: 50.11,
        mode: "test",
      },
      {
        id: 13,
        datetime: 1760498562209,
        sensor_id: "2",
        co2: 450.39,
        temperature: 22.01,
        humidity: 50.02,
        mode: "test",
      },
      {
        id: 14,
        datetime: 1760498562210,
        sensor_id: "3",
        co2: 400.11,
        temperature: 22.04,
        humidity: 49.84,
        mode: "test",
      },
      {
        id: 15,
        datetime: 1760498562211,
        sensor_id: "2",
        co2: 450.14,
        temperature: 22.01,
        humidity: 49.93,
        mode: "test",
      },
      {
        id: 16,
        datetime: 1760498562212,
        sensor_id: "3",
        co2: 399.93,
        temperature: 22.01,
        humidity: 50.13,
        mode: "test",
      },
      {
        id: 17,
        datetime: 1760498566374,
        sensor_id: "2",
        co2: 449.95,
        temperature: 22.04,
        humidity: 50.02,
        mode: "test",
      },
      {
        id: 18,
        datetime: 1760498566376,
        sensor_id: "3",
        co2: 400.06,
        temperature: 22.01,
        humidity: 50.17,
        mode: "test",
      },
      {
        id: 19,
        datetime: 1760498566378,
        sensor_id: "2",
        co2: 449.81,
        temperature: 22,
        humidity: 49.88,
        mode: "test",
      },
      {
        id: 20,
        datetime: 1760498566379,
        sensor_id: "3",
        co2: 399.89,
        temperature: 21.97,
        humidity: 50.05,
        mode: "test",
      },
    ];

    setIaq(debug_data);
    // console.log(hlrData.data);
    setIsMode("idle");
    setIsSystemRunning(false);
    getLastestIAQData(debug_data);
  };

  useEffect(() => {
    fetchFristTime();
  }, []);

  const handlerConvertSensor = (sid: string) => {
    if (sid === "1") {
      return "Calibrate";
    } else if (sid === "2") {
      return "Outlet";
    } else if (sid === "3") {
      return "Inlet";
    } else if (sid === "4") {
      return "Regen";
    }
  };

  const co2Series = useMemo(() => {
    // group by sensor_id
    const bySensor = new Map<string, { x: number; y: number }[]>();

    for (const row of iaq ?? []) {
      console.log("row => ", row);
      const sid = String(row.sensor_id);
      // ถ้า timestamp เดิมเป็น "วินาที" ให้เปลี่ยนเป็น ms: const t = row.datetime * 1000;
      const t = Number(row.datetime); // สมมติว่าคุณส่งมาเป็น "ms" แล้ว
      if (!bySensor.has(sid)) bySensor.set(sid, []);
      bySensor.get(sid)!.push({ x: t, y: row.co2 });
    }

    // sort ตามเวลาและ map เป็นรูปแบบที่ ApexCharts ต้องการ
    return Array.from(bySensor.entries()).map(([sid, points]) => ({
      name: `CO₂ ${handlerConvertSensor(sid)}`,
      data: points.sort((a, b) => a.x - b.x),
    }));
  }, [iaq]);

  const TempSeries = useMemo(() => {
    // group by sensor_id
    const bySensor = new Map<string, { x: number; y: number }[]>();

    for (const row of iaq ?? []) {
      const sid = String(row.sensor_id);
      // ถ้า timestamp เดิมเป็น "วินาที" ให้เปลี่ยนเป็น ms: const t = row.datetime * 1000;
      const t = Number(row.datetime); // สมมติว่าคุณส่งมาเป็น "ms" แล้ว
      if (!bySensor.has(sid)) bySensor.set(sid, []);
      bySensor.get(sid)!.push({ x: t, y: row.temperature });
    }

    // sort ตามเวลาและ map เป็นรูปแบบที่ ApexCharts ต้องการ
    return Array.from(bySensor.entries()).map(([sid, points]) => ({
      name: `Temperature Sensor ${handlerConvertSensor(sid)}`,
      data: points.sort((a, b) => a.x - b.x),
    }));
  }, [iaq]);

  const HumidSeries = useMemo(() => {
    // group by sensor_id
    const bySensor = new Map<string, { x: number; y: number }[]>();

    for (const row of iaq ?? []) {
      const sid = String(row.sensor_id);
      // ถ้า timestamp เดิมเป็น "วินาที" ให้เปลี่ยนเป็น ms: const t = row.datetime * 1000;
      const t = Number(row.datetime); // สมมติว่าคุณส่งมาเป็น "ms" แล้ว
      if (!bySensor.has(sid)) bySensor.set(sid, []);
      bySensor.get(sid)!.push({ x: t, y: row.humidity });
    }

    // sort ตามเวลาและ map เป็นรูปแบบที่ ApexCharts ต้องการ
    return Array.from(bySensor.entries()).map(([sid, points]) => ({
      name: `Humidity Sensor ${handlerConvertSensor(sid)}`,
      data: points.sort((a, b) => a.x - b.x),
    }));
  }, [iaq]);

  // ── Chart options (Dark Mode)
  const optionsCo2: any = {
    theme: { mode: "dark" },
    chart: {
      id: "co2-line",
      type: "line",
      height: 360,
      background: "transparent",
      animations: { enabled: true, easing: "easeinout", speed: 500 },
      toolbar: { show: true },
      zoom: { enabled: true },
      foreColor: "#cbd5e1",
    },
    stroke: { curve: "smooth", width: 2 },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      type: "datetime",
      // ✅ ไม่ต้องใช้ categories
      labels: { datetimeUTC: false, style: { colors: "#94a3b8" } },
      axisBorder: { color: "#334155" },
      axisTicks: { color: "#334155" },
      tooltip: { enabled: false },
    },
    yaxis: {
      title: { text: "CO₂ (ppm)", style: { color: "#cbd5e1" } },
      decimalsInFloat: 0,
      min: 0,
      labels: { style: { colors: "#94a3b8" } },
      axisBorder: { color: "#334155" },
      axisTicks: { color: "#334155" },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      markers: { width: 10, height: 10, radius: 12 },
      onItemClick: { toggleDataSeries: true },
      labels: { colors: "#cbd5e1" },
    },
    tooltip: {
      theme: "dark",
      shared: true, // hover รวมหลายเส้น
      x: { format: "HH:mm" },
      y: { formatter: (val: any) => `${val?.toFixed?.(0)} ppm` },
    },
    grid: { borderColor: "#334155" },
    colors: ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#f87171"],
  };

  const optionsTemp: any = {
    theme: { mode: "dark" },
    chart: {
      id: "temp-line",
      type: "line",
      height: 360,
      background: "transparent",
      animations: { enabled: true, easing: "easeinout", speed: 500 },
      toolbar: { show: true },
      zoom: { enabled: true },
      foreColor: "#cbd5e1",
    },
    stroke: { curve: "smooth", width: 2 },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      type: "datetime",
      // ✅ ไม่ต้องใช้ categories
      labels: { datetimeUTC: false, style: { colors: "#94a3b8" } },
      axisBorder: { color: "#334155" },
      axisTicks: { color: "#334155" },
      tooltip: { enabled: false },
    },
    yaxis: {
      title: { text: "Temp (C)", style: { color: "#cbd5e1" } },
      decimalsInFloat: 0,
      min: 0,
      labels: { style: { colors: "#94a3b8" } },
      axisBorder: { color: "#334155" },
      axisTicks: { color: "#334155" },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      markers: { width: 10, height: 10, radius: 12 },
      onItemClick: { toggleDataSeries: true },
      labels: { colors: "#cbd5e1" },
    },
    tooltip: {
      theme: "dark",
      shared: true, // hover รวมหลายเส้น
      x: { format: "HH:mm" },
      y: { formatter: (val: any) => `${val?.toFixed?.(0)} C` },
    },
    grid: { borderColor: "#334155" },
    colors: ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#f87171"],
  };

  const optionsHumid: any = {
    theme: { mode: "dark" },
    chart: {
      id: "humid-line",
      type: "line",
      height: 360,
      background: "transparent",
      animations: { enabled: true, easing: "easeinout", speed: 500 },
      toolbar: { show: true },
      zoom: { enabled: true },
      foreColor: "#cbd5e1",
    },
    stroke: { curve: "smooth", width: 2 },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      type: "datetime",
      // ✅ ไม่ต้องใช้ categories
      labels: { datetimeUTC: false, style: { colors: "#94a3b8" } },
      axisBorder: { color: "#334155" },
      axisTicks: { color: "#334155" },
      tooltip: { enabled: false },
    },
    yaxis: {
      title: { text: "Humid (%RH)", style: { color: "#cbd5e1" } },
      decimalsInFloat: 0,
      min: 0,
      labels: { style: { colors: "#94a3b8" } },
      axisBorder: { color: "#334155" },
      axisTicks: { color: "#334155" },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      markers: { width: 10, height: 10, radius: 12 },
      onItemClick: { toggleDataSeries: true },
      labels: { colors: "#cbd5e1" },
    },
    tooltip: {
      theme: "dark",
      shared: true, // hover รวมหลายเส้น
      x: { format: "HH:mm" },
      y: { formatter: (val: any) => `${val?.toFixed?.(0)} %RH` },
    },
    grid: { borderColor: "#334155" },
    colors: ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#f87171"],
  };

  return (
    <div className="ml-[4%] min-h-screen  flex justify-center  bg-gray-950 text-gray-100">
      <div className="w-[85%] mt-10 border-[1px] border-gray-500 p-3 mb-10 rounded-lg">
        <div className="p-4">
          <div>
            System:
            <span
              className={`ml-2 ${
                isSystemRunning === false ? "text-red-500" : "text-green-500"
              }`}
            >
              {isSystemRunning ? "Running" : "Offline"}
            </span>
          </div>
          <div className={`${isMode === ""}`}>Mode: {isMode}</div>
        </div>
        <div className="">
          <div className="ml-5 mr-5 border-[1px] border-gray-500 rounded-md h-[100%]  p-3 pb-8">
            {isNewestIAQ?.map((el: any, index: number) => {
              if (el.id !== "-") {
                return (
                  <div key={index}>
                    <div className="mt-5 mb-5 ml-3">
                      <span className="border-b-[1px]">Sensor: {el.label}</span>
                      <span className="text-[13px] text-gray-600 ml-5">
                        Update {new Date(el.datetime).getDate()}/
                        {new Date(el.datetime).getMonth() + 1}/
                        {new Date(el.datetime).getFullYear()}{" "}
                        {new Date(el.datetime).getHours()}:
                        {new Date(el.datetime).getMinutes()}:
                        {new Date(el.datetime).getSeconds()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 mt-3">
                      <div className="border-[1px] border-gray-500 p-2 w-[200px] rounded-lg text-center m-auto ">
                        <div>CO₂ (ppm)</div>
                        <div className="mt-10 text-[23px]">{el.co2}</div>
                      </div>
                      <div className="border-[1px] border-gray-500 p-2 w-[200px] rounded-lg text-center m-auto">
                        <div>Temperature (C)</div>
                        <div className="mt-10 text-[23px]">
                          {el.temperature}
                        </div>
                      </div>
                      <div className="border-[1px] border-gray-500 p-2 w-[200px] rounded-lg text-center m-auto">
                        <div>Humidity (%RH)</div>
                        <div className="mt-10 text-[23px]">{el.humidity} %</div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
          <div className="p-4 text-[20px] font-semibold text-gray-100">
            CO₂ (ppm)
          </div>
          {/* Chart Card */}
          <div className="px-4 pb-8">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow p-4">
              <ReactApexChart
                options={optionsCo2}
                series={co2Series}
                type="line"
                height={360}
              />
            </div>
          </div>
        </div>
        <div>
          <div className="p-4 text-[20px] font-semibold text-gray-100">
            Humidity (%RH)
          </div>
          {/* Chart Card */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow p-4">
            <ReactApexChart
              options={optionsTemp}
              series={TempSeries}
              type="line"
              height={360}
            />
          </div>
        </div>
        <div>
          <div className="p-4 text-[20px] font-semibold text-gray-100">
            Temperature (Celsius)
          </div>
          {/* Chart Card */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow p-4">
            <ReactApexChart
              options={optionsHumid}
              series={HumidSeries}
              type="line"
              height={360}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
