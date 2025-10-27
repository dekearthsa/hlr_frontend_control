import { useMemo, useState, useEffect, useRef } from "react";
import ReactApexChart from "react-apexcharts";
import useSWR from "swr";
import axios from "axios";

const HTTP_API = "http://172.29.247.140:3011";
// const HTTP_API = "http://192.168.1.39:3011";
type Row = {
  id: string;
  sensor_id: string | number;
  datetime: number; // ms
  co2: number;
  temperature: number;
  humidity: number;
};

// const stateList: string[] = ["regen", "cooldown", "idle", "scrub"];

// --- 1) นาฬิกา 1Hz และหน้าต่างเวลาเลื่อน abcDEF99
const useNowTicker = (intervalMs: number) => {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]); // 👈 สำคัญ! พอ intervalMs เปลี่ยนจะ restart timer ใหม่

  return nowMs;
};

// --- 4) สร้างซีรีส์แบบเติม null ตรงว่าง
function buildSeries(
  rows: Row[],
  windowStart: number,
  windowEnd: number,
  pickY: (r: Row) => number,
  sensorLabel: (sid: string) => string
) {
  const bySensor = new Map<string, { x: number; y: number }[]>();

  for (const r of rows) {
    if (r.datetime < windowStart || r.datetime > windowEnd) continue;
    const sid = String(r.sensor_id);
    if (!bySensor.has(sid)) bySensor.set(sid, []);
    bySensor.get(sid)!.push({ x: r.datetime, y: pickY(r) });
  }

  return Array.from(bySensor.entries()).map(([sid, pts]) => ({
    name: sensorLabel(sid),
    data: pts.sort((a, b) => a.x - b.x),
  }));
}

const fetcher = async (url: string) => axios.get(url).then((res) => res.data);

const Dashboard = () => {
  // ── Mock data
  const postFetcher = async ([url, body]: [
    string,
    { start: number; latesttime: number }
  ]) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.text()) || "POST failed");
    return res.json();
  };
  const [tickSpeed, setTickSpeed] = useState(5000); // 1 วินาทีเริ่มต้น
  const [timeHis, setTimeHis] = useState(1800000); // default start 30 mins
  const [intervalMs, setIntervalMs] = useState(10000); // 10 sec
  const [isNewestIAQ, setNewestIAQ] = useState<any[]>();
  const [statusSystem, setStatusSystem] = useState<{
    mode: string;
    system: string;
  }>({ mode: "", system: "" });
  const [countDownTime, setCountDownTime] = useState<number>(0);
  // const [standby, setStandby] = useState<boolean>(false);
  const [isMode, setIsMode] = useState("idle");
  const [iaq, setIaq] = useState<any[]>([]);
  // const [isSystemRunning, setIsSystemRunning] = useState(false);
  // const [lastest, setLastest] = useState(0);
  const latesttimeRef = useRef<number>(0);
  const nowMs = useNowTicker(tickSpeed);
  const windowStart = nowMs - timeHis;
  // const stepMs = pickStepMs(timeHis);

  const handleMode = (setType: string) => {
    if (setType === "end") {
      return "end";
    } else if (setType === "cooldown") {
      return "regen";
    } else if (setType === "idle") {
      return "cooldown";
    } else if (setType === "scrub") {
      return "idle";
    } else if (setType === "regen") {
      return "scrub";
    }
  };

  const handleGetStatus = async () => {
    const { data } = await axios.get(`${HTTP_API}/get/status`);
    const modeOut = handleMode(data[0].systemState);

    const stateP = {
      system: data[0].systemType,
      mode: modeOut ? modeOut : "Error can't find state.",
    };
    // console.log("stateP => ", stateP);
    const ms = Date.now();
    const endTime = data[0].endtime;
    const downTime: number =
      endTime - ms <= 0 ? 0 : (endTime - ms) / (60 * 1000);
    setStatusSystem(stateP);
    setCountDownTime(downTime);
  };

  const { mutate } = useSWR(
    [
      `${HTTP_API}/loop/data/iaq`,
      { start: Date.now() - timeHis, latesttime: latesttimeRef.current || 0 },
    ],
    postFetcher,
    {
      refreshInterval: intervalMs,
      onSuccess: (d: Row[]) => {
        // if (standby) return;
        if (!d?.length) return;
        latesttimeRef.current = d[d.length - 1].datetime;
        // console.log("data => ", d);
        setIaq((prev) => {
          const cutoff = Date.now() - timeHis;
          const merged = [...prev, ...d];
          const map = new Map<string, Row>();
          for (const r of merged) {
            const key = r.id ?? `${r.sensor_id}-${r.datetime}`;
            map.set(key, r); // ของใหม่จะทับของเก่าอัตโนมัติ
          }
          handleGetStatus();
          return Array.from(map.values())
            .filter((r) => r.datetime >= cutoff)
            .sort((a, b) => a.datetime - b.datetime);
        });
        getLastestIAQData(d);
      },
    }
  );

  const handleExport = async () => {
    await mutate(); // โพสต์ด้วยคีย์ปัจจุบัน (start/latesttime) แล้วอัปเดต data
  };

  const labelSensor = (sid: string) =>
    ({
      "1": "CO₂ Calibrate",
      "2": "CO₂ Outlet",
      "3": "CO₂ Inlet",
      "4": "CO₂ Regen",
    }[sid] || `CO₂ Sensor ${sid}`);

  const handlerStartGet = async (ms: number) => {
    // setStandby(true);
    const payload = {
      start: Date.now() - ms,
      latesttime: 0,
    };
    const newData = await axios.post(`${HTTP_API}/loop/data/iaq`, payload);
    // console.log(newData);
    setIaq(newData.data);
    // setStandby(false);
  };
  // ถ้าอยากให้ POST อัตโนมัติเมื่อเปลี่ยนช่วงเวลา (เช่นกด 30M/1H/1D)
  useEffect(() => {
    handleExport();
  }, [timeHis]); // <-- เปลี่ยนช่วงเวลา = ยิง POST หนึ่งครั้ง

  const getLastestIAQData = async (data: any) => {
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
    const arrayData = [latest1, latest2, latest3, latest4];
    setNewestIAQ(arrayData);
  };

  const commonX = useMemo(
    () => ({
      type: "datetime",
      min: windowStart,
      max: nowMs,
      labels: { datetimeUTC: false, style: { colors: "#94a3b8" } },
      axisBorder: { color: "#334155" },
      axisTicks: { color: "#334155" },
      tooltip: { enabled: false },
    }),
    [windowStart, nowMs]
  );

  // --- 5) ซีรีส์ที่ “เลื่อนทุกวินาที” และมีช่องว่างเมื่อไม่มีข้อมูล
  const co2Series = useMemo(() => {
    return buildSeries(iaq, windowStart, nowMs, (r) => r.co2, labelSensor);
  }, [iaq, windowStart, nowMs]);

  const tempSeries = useMemo(() => {
    const label = (sid: string) =>
      ({
        "1": "Temp Calibrate",
        "2": "Temp Outlet",
        "3": "Temp Inlet",
        "4": "Temp Regen",
        "51": "Temp TK",
      }[sid] || `Temp ${sid}`);
    return buildSeries(iaq, windowStart, nowMs, (r) => r.temperature, label);
  }, [iaq, windowStart, nowMs]);

  const humidSeries = useMemo(() => {
    const label = (sid: string) =>
      ({
        "1": "Humid Calibrate",
        "2": "Humid Outlet",
        "3": "Humid Inlet",
        "4": "Humid Regen",
        "51": "Humid TK",
      }[sid] || `Humid ${sid}`);
    return buildSeries(iaq, windowStart, nowMs, (r) => r.humidity, label);
  }, [iaq, windowStart, nowMs]);

  const optionsCo2: any = {
    theme: { mode: "dark" },
    chart: {
      id: "co2-line",
      type: "line",
      height: 360,
      background: "transparent",
      animations: { enabled: true, easing: "easeinout", speed: 300 },
      toolbar: { show: true },
      zoom: { enabled: true },
      foreColor: "#cbd5e1",
    },
    stroke: {
      curve: "smooth",
      width: 2 /* , connectNulls: false (ถ้ามีในเวอร์ชันคุณ ให้ปิด) */,
      connectNulls: true,
    },
    markers: { size: 0, hover: { size: 4 } },
    xaxis: commonX,
    yaxis: {
      title: { text: "CO₂ (ppm)", style: { color: "#cbd5e1" } },
      decimalsInFloat: 0,
      min: 0,
      labels: { style: { colors: "#94a3b8" } },
      axisBorder: { color: "#334155" },
      axisTicks: { color: "#334155" },
    },
    tooltip: {
      theme: "dark",
      shared: true,
      x: { format: "HH:mm:ss" },
      y: { formatter: (v: any) => (v == null ? "-" : `${v.toFixed?.(0)} ppm`) },
    },
    grid: { borderColor: "#334155" },
  };

  const optionsTemp = {
    ...optionsCo2,
    yaxis: {
      ...optionsCo2.yaxis,
      title: { text: "Temp (°C)", style: { color: "#cbd5e1" } },
    },
    tooltip: {
      theme: "dark",
      shared: true,
      x: { format: "HH:mm:ss" },
      y: { formatter: (v: any) => (v == null ? "-" : `${v.toFixed?.(0)} °C`) },
    },
  };
  const optionsHumid = {
    ...optionsCo2,
    yaxis: {
      ...optionsCo2.yaxis,
      title: { text: "Humid (%RH)", style: { color: "#cbd5e1" } },
    },
    tooltip: {
      theme: "dark",
      shared: true,
      x: { format: "HH:mm:ss" },
      y: { formatter: (v: any) => (v == null ? "-" : `${v.toFixed?.(0)} %RH`) },
    },
  };

  return (
    <div className="ml-[4%] min-h-screen  flex justify-center  bg-gray-950 text-gray-100">
      <div className="w-[85%] mt-10 border-[1px] border-gray-500 p-3 mb-10 rounded-lg">
        <div className="flex justify-between">
          <div className="p-4">
            <div>
              System: {statusSystem.system ? statusSystem.system : "Offline"}
              {/* <span
                className={`ml-2 ${
                  isSystemRunning === false ? "text-red-500" : "text-green-500"
                }`}
              >
                {isSystemRunning ? "Running" : "Offline"}
              </span> */}
            </div>
            <div className={`${isMode === ""}`}>Mode: {statusSystem.mode}</div>
            <div>Count down {countDownTime.toFixed(0)} min</div>
          </div>
          <div className="p-4  text-[12px]">
            <div className="">
              <div className="mr-10 mb-2">
                <label>Previous</label>
              </div>
              <div className="flex">
                <button
                  className={`mr-3 border-[1px] border-gray-700 p-2 rounded-lg ${
                    timeHis === 2592000000 ? "bg-gray-600" : ""
                  }`}
                  onClick={() => {
                    setTimeHis(2592000000);
                    handlerStartGet(2592000000);
                  }}
                >
                  1MONTH
                </button>
                <button
                  className={`mr-3 border-[1px] border-gray-700 p-2 rounded-lg ${
                    timeHis === 604800000 ? "bg-gray-600" : ""
                  }`}
                  onClick={() => {
                    setTimeHis(604800000);
                    handlerStartGet(604800000);
                  }}
                >
                  7DAYS
                </button>
                <button
                  className={`mr-3 border-[1px] border-gray-700 p-2 rounded-lg ${
                    timeHis === 24 * 60 * 60 * 1000 ? "bg-gray-600" : ""
                  }`}
                  onClick={() => {
                    setTimeHis(24 * 60 * 60 * 1000);
                    handlerStartGet(24 * 60 * 60 * 1000);
                  }}
                >
                  1DAYS
                </button>
                <button
                  className={`mr-3 border-[1px] border-gray-700 p-2 rounded-lg ${
                    timeHis === 12 * 60 * 60 * 1000 ? "bg-gray-600" : ""
                  }`}
                  onClick={() => {
                    setTimeHis(12 * 60 * 60 * 1000);
                    handlerStartGet(12 * 60 * 60 * 1000);
                  }}
                >
                  12HOURS
                </button>
                <button
                  className={`mr-3 border-[1px] border-gray-700 p-2 rounded-lg ${
                    timeHis === 4 * 60 * 60 * 1000 ? "bg-gray-600" : ""
                  }`}
                  onClick={() => {
                    setTimeHis(4 * 60 * 60 * 1000);
                    handlerStartGet(4 * 60 * 60 * 1000);
                  }}
                >
                  4HOURS
                </button>
                <button
                  className={`mr-3 border-[1px] border-gray-700 p-2 rounded-lg ${
                    timeHis === 3600000 ? "bg-gray-600" : ""
                  }`}
                  onClick={() => {
                    setTimeHis(3600000);
                    handlerStartGet(3600000);
                  }}
                >
                  1HOURS
                </button>
                <button
                  className={`mr-3 border-[1px] border-gray-700 p-2 rounded-lg ${
                    timeHis === 1800000 ? "bg-gray-600" : ""
                  }`}
                  onClick={() => {
                    setTimeHis(1800000);
                    handlerStartGet(1800000);
                  }}
                >
                  30MIN
                </button>
              </div>
            </div>

            <div className="mt-5">
              <div className="mr-10 mb-2">
                <label>Step</label>
              </div>
              <div className="flex">
                <button
                  className={`mr-3 border-[1px] border-gray-700 p-2 rounded-lg ${
                    tickSpeed === 60 * 60 * 1000 ? "bg-gray-600" : ""
                  }`}
                  onClick={() => {
                    setTickSpeed(60 * 60 * 1000);
                  }}
                >
                  1HRS
                </button>
                <button
                  className={`mr-3 border-[1px] border-gray-700 p-2 rounded-lg ${
                    tickSpeed === 10 * 60 * 1000 ? "bg-gray-600" : ""
                  }`}
                  onClick={() => {
                    setTickSpeed(10 * 60 * 1000);
                  }}
                >
                  10MIN
                </button>
                <button
                  className={`mr-3 border-[1px] border-gray-700 p-2 rounded-lg ${
                    tickSpeed === 60 * 1000 ? "bg-gray-600" : ""
                  }`}
                  onClick={() => {
                    setTickSpeed(60 * 1000);
                  }}
                >
                  1MIN
                </button>
                <button
                  className={`mr-3 border-[1px] border-gray-700 p-2 rounded-lg ${
                    tickSpeed === 10000 ? "bg-gray-600" : ""
                  }`}
                  onClick={() => {
                    setTickSpeed(10000);
                  }}
                >
                  10S
                </button>
                <button
                  className={`mr-3 border-[1px] border-gray-700 p-2 rounded-lg ${
                    tickSpeed === 5000 ? "bg-gray-600" : ""
                  }`}
                  onClick={() => {
                    setTickSpeed(5000);
                  }}
                >
                  5S
                </button>
                <button
                  className={`mr-3 border-[1px] border-gray-700 p-2 rounded-lg ${
                    tickSpeed === 1000 ? "bg-gray-600" : ""
                  }`}
                  onClick={() => {
                    setTickSpeed(1000);
                  }}
                >
                  1S
                </button>
              </div>
            </div>
          </div>
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
            Temperature (Celsius)
          </div>
          {/* Chart Card */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow p-4">
            <ReactApexChart
              options={optionsTemp}
              series={tempSeries}
              type="line"
              height={360}
            />
          </div>
        </div>
        <div>
          <div className="p-4 text-[20px] font-semibold text-gray-100">
            Humidity (%RH)
          </div>
          {/* Chart Card */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow p-4">
            <ReactApexChart
              options={optionsHumid}
              series={humidSeries}
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
