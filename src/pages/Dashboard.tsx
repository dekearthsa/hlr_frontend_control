import { useMemo, useState, useEffect, useRef } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
// import ExportingModule from "highcharts/modules/exporting";
// import ExportDataModule from "highcharts/modules/export-data";
import useSWR from "swr";
import axios from "axios";
// import { averagePerMinute } from "../helper/helper";

// const HTTP_API = "https://4fbf7b7f1d3d.ngrok-free.app";
// const HTTP_API = "http://172.29.246.80:3011";
const HTTP_API = "https://api1.bkkcodedevearthregisterdemobkk.work";
// const HTTP_API = "http://localhost:3011";
// const HTTP_API = "http://192.168.1.39:3011";

// (ExportingModule as unknown as (H: typeof Highcharts) => typeof Highcharts)(
//   Highcharts
// );
// (ExportDataModule as unknown as (H: typeof Highcharts) => typeof Highcharts)(
//   Highcharts
// );

type Row = {
  id: string;
  sensor_id: string | number;
  timestamp: number; // ms
  co2: number;
  temperature: number;
  humidity: number;
};

type ApIaqRow = {
  timestamp: number;
  CO2: number;
};

const myApi = axios.create({
  baseURL: 'https://6cq2hsx83h.execute-api.ap-southeast-1.amazonaws.com',
  headers: {
    "ngrok-skip-browser-warning": "true",
    Accept: "application/json",
  },
  timeout: 8000,
});

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
    if (r.timestamp < windowStart || r.timestamp > windowEnd) continue;
    const sid = String(r.sensor_id);
    if (!bySensor.has(sid)) bySensor.set(sid, []);
    bySensor.get(sid)!.push({ x: r.timestamp, y: pickY(r) });
  }

  return Array.from(bySensor.entries()).map<Highcharts.SeriesSplineOptions>(
    ([sid, pts]) => ({
      type: "spline",
      name: sensorLabel(sid),
      data: pts.sort((a, b) => a.x - b.x).map((pt) => ({ x: pt.x, y: pt.y })),
      connectNulls: true,
    })
  );
}

function buildChartOptions(
  series: Highcharts.SeriesSplineOptions[],
  yAxisTitle: string,
  unitLabel: string,
  windowStart: number,
  windowEnd: number
): Highcharts.Options {
  return {
    time: {
      timezone: "Asia/Bangkok", // ใช้เวลาไทย
      // useUTC: false,          // ถ้าอยากบังคับไม่ใช้ UTC ก็ใส่ได้
    },
    chart: {
      type: "spline",
      height: 360,
      backgroundColor: "transparent",
      style: { fontFamily: "Inter, 'Noto Sans Thai', sans-serif" },

      zooming: {
        type: "x",
      },
      panning: {
        enabled: true,
        type: "x",
      },
      panKey: "shift", // 👈 ต้องกด Shift ค้างเพื่อ pan (optional)
      resetZoomButton: {
        theme: {
          fill: "#1e293b",
          stroke: "#64748b",
          r: 4,
          style: { color: "#e2e8f0" },
        },
      },
    },

    title: { text: undefined },
    legend: {
      itemStyle: { color: "#cbd5e1" },
    },
    xAxis: {
      type: "datetime",
      min: windowStart,
      max: windowEnd,
      crosshair: { color: "rgba(148,163,184,0.35)" },
      labels: {
        style: { color: "#94a3b8" },
        format: "{value:%d/%m %H:%M}", // 👈 บังคับให้เป็น 24 ชม. เช่น 13:05
        // ถ้าอยากเห็นวินาทีด้วย:
        // format: "{value:%H:%M:%S}",
      },
      lineColor: "#334155",
      tickColor: "#334155",
    },

    yAxis: {
      title: { text: yAxisTitle, style: { color: "#cbd5e1" } },
      labels: { style: { color: "#94a3b8" } },
      min: 0,
      gridLineColor: "#334155",
    },
    tooltip: {
      shared: true,
      backgroundColor: "#020617",
      borderColor: "#1f2933",
      style: { color: "#e5e7eb" },
      xDateFormat: "%H:%M:%S",
      valueSuffix: ` ${unitLabel}`,
      valueDecimals: 2,
    },
    plotOptions: {
      series: {
        marker: { enabled: false },
        lineWidth: 2,
        connectNulls: true,
      },
    },
    series,
    credits: { enabled: false },
    exporting: { enabled: true },
  };
}

// const fetcher = async (url: string) => axios.get(url).then((res) => res.data);

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
  // const [tickSpeed, setTickSpeed] = useState(10000); // 1 วินาทีเริ่มต้น
  const [timeHis, setTimeHis] = useState(1800000); // default start 30 mins
  // const [intervalMs, setIntervalMs] = useState(10000); // 10 sec
  const [isNewestIAQ, setNewestIAQ] = useState<any[]>();
  const [statusSystem, setStatusSystem] = useState<{
    mode: string;
    system: string;
  }>({ mode: "", system: "" });
  const [countDownTime, setCountDownTime] = useState<number>(0);
  const [nameLabel, setNameLabel] = useState("");
  const [loopCount, setLoopCount] = useState(0);
  // const [standby, setStandby] = useState<boolean>(false);
  // const [isMode, setIsMode] = useState("idle");
  const [iaq, setIaq] = useState<any[]>([]);
  const [apIaq, setApIaq] = useState<ApIaqRow[]>([]);
  // const [apLatestCo2, setApLatestCo2] = useState<number | null>(null);
  // const [isSystemRunning, setIsSystemRunning] = useState(false);
  // const [lastest, setLastest] = useState(0);
  const latesttimeRef = useRef<number>(0);
  const latesttimeApRef = useRef<number>(0);
  const nowMs = useNowTicker(5000); // tickSpeed
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
    const { data } = await myApi.get(`/data/state`);
    console.log("data => ", data);
    const modeOut = handleMode(data[0].systemState);
    // console.log(data);
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
    setNameLabel(data[0].cyclicName);
    setLoopCount(data[0].cyclic_loop_dur);
  };

  const { mutate } = useSWR(
    [
      // `${HTTP_API}/loop/data/iaq`,
      `https://6cq2hsx83h.execute-api.ap-southeast-1.amazonaws.com/data/get`,
      {
        start: nowMs - timeHis,
        latesttime: latesttimeRef.current || 0,
        rangeSelected: 0,
      },
    ],
    postFetcher,
    {
      refreshInterval: 100000,
      onSuccess: (d: Row[]) => {
        // if (standby) return;
        if (!d?.length) return;
        latesttimeRef.current = d[d.length - 1].timestamp;
        // console.log("data => ", d);
        setIaq((prev) => {
          const cutoff = Date.now() - timeHis;
          const merged = [...prev, ...d];
          const map = new Map<string, Row>();
          for (const r of merged) {
            const key = r.id ?? `${r.sensor_id}-${r.timestamp}`;
            map.set(key, r); // ของใหม่จะทับของเก่าอัตโนมัติ
          }
          handleGetStatus(); 
          return Array.from(map.values())
            .filter((r) => r.timestamp >= cutoff)
            .sort((a, b) => a.timestamp - b.timestamp);
        });
        getLastestIAQData(d);
      },
    }
  );

  const { mutate: mutateApIaq } = useSWR(
    [
      `https://6cq2hsx83h.execute-api.ap-southeast-1.amazonaws.com/data/iaq`,
      {
        start: nowMs - timeHis,
        latesttime: latesttimeApRef.current || 0,
        rangeSelected: 0,
      },
    ],
    postFetcher,
    {
      refreshInterval: 100000,
      onSuccess: (d: ApIaqRow[]) => { 
        if (!d?.length) return;
        latesttimeApRef.current = d[d.length - 1].timestamp;
        setApIaq((prev) => {
          const cutoff = Date.now() - timeHis;
          const merged = [...prev, ...d];
          const map = new Map<number, ApIaqRow>();
          for (const r of merged) {
            map.set(r.timestamp, r);
          }
          const result = Array.from(map.values())
            .filter((r) => r.timestamp >= cutoff)
            .sort((a, b) => a.timestamp - b.timestamp);
          // const latest = result[result.length - 1];
          // setApLatestCo2(latest ? latest.CO2 : null);
          return result;
        });
      },
    }
  );

  const handleExport = async () => {
    await mutate(); // โพสต์ด้วยคีย์ปัจจุบัน (start/latesttime) แล้วอัปเดต data
    await mutateApIaq();
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
      rangeSelected: ms,
    };
    const newData = await axios.post(`${HTTP_API}/loop/data/iaq`, payload);
    const newApData = await axios.post(
      `${HTTP_API}/loop/data/ap-iaq`,
      payload
    );
    // console.log("newData => ", newData.data);
    // const dataAvg = averagePerMinute(newData.data, ms);
    // console.log("dataAvg => ", dataAvg);
    setIaq(newData.data);
    setApIaq(newApData.data || []);
    // const latest = newApData.data?.[newApData.data.length - 1];
    // setApLatestCo2(latest ? latest.CO2 : null);
    // setStandby(false);
  };
  // ถ้าอยากให้ POST อัตโนมัติเมื่อเปลี่ยนช่วงเวลา (เช่นกด 30M/1H/1D)
  useEffect(() => {
    handleExport();
  }, [timeHis]); // <-- เปลี่ยนช่วงเวลา = ยิง POST หนึ่งครั้ง

  const getLastestIAQData = async (data: any) => {
    // console.log("data getLastestIAQData => ", data);

    const arraySensor2: any[] = [];
    const arraySensor3: any[] = [];

    for (const el of data) {
      if (el.sensor_id === 2) {
        const payload = {
          id: el.id,
          label: "Outlet",
          sensor_id: el.sensor_id,
          timestamp: el.timestamp,
          co2: el.co2,
          temperature: el.temperature,
          humidity: el.humidity,
        };
        arraySensor2.push(payload);
      } else if (el.sensor_id === 3) {
        const payload = {
          id: el.id,
          label: "Inlet",
          sensor_id: el.sensor_id,
          timestamp: el.timestamp,
          co2: el.co2,
          temperature: el.temperature,
          humidity: el.humidity,
        };
        arraySensor3.push(payload);
      }
    }

    setNewestIAQ((prev) => {
      const prev2 = prev?.[0];
      const prev3 = prev?.[1];

      const latest2 =
        arraySensor2.length > 0
          ? arraySensor2[arraySensor2.length - 1]
          : prev2
          ? prev2
          : {
              id: "-",
              sensor_id: 0,
              timestamp: 0,
              co2: 0,
              humidity: 0,
              temperature: 0,
              mode: "",
            };

      const latest3 =
        arraySensor3.length > 0
          ? arraySensor3[arraySensor3.length - 1]
          : prev3
          ? prev3
          : {
              id: "-",
              sensor_id: 0,
              timestamp: 0,
              co2: 0,
              humidity: 0,
              temperature: 0,
              mode: "",
            };

      return [latest2, latest3];
    });
  };

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

  const optionsCo2 = useMemo<Highcharts.Options>(
    () => buildChartOptions(co2Series, "CO₂ (ppm)", "ppm", windowStart, nowMs),
    [co2Series, windowStart, nowMs]
  );

  const apCo2Series = useMemo<Highcharts.SeriesSplineOptions[]>(
    () => [
      {
        type: "spline",
        name: "CO₂-AP",
        data: apIaq
          .filter((r) => r.timestamp >= windowStart && r.timestamp <= nowMs)
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((r) => ({ x: r.timestamp, y: r.CO2 })),
        connectNulls: true,
      },
    ],
    [apIaq, windowStart, nowMs]
  );

  const optionsApCo2 = useMemo<Highcharts.Options>(
    () =>
      buildChartOptions(apCo2Series, "CO₂-AP (ppm)", "ppm", windowStart, nowMs),
    [apCo2Series, windowStart, nowMs]
  );

  const optionsTemp = useMemo<Highcharts.Options>(
    () => buildChartOptions(tempSeries, "Temp (°C)", "°C", windowStart, nowMs),
    [tempSeries, windowStart, nowMs]
  );

  const optionsHumid = useMemo<Highcharts.Options>(
    () =>
      buildChartOptions(humidSeries, "Humid (%RH)", "%RH", windowStart, nowMs),
    [humidSeries, windowStart, nowMs]
  );

  return (
    <div className="ml-[4%] min-h-screen  flex justify-center  bg-gray-950 text-gray-100">
      <div className="w-[85%] mt-10 border-[1px] border-gray-500 p-3 mb-10 rounded-lg">
        <div className="flex justify-between">
          <div className="p-4">
            <div>{nameLabel}</div>
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
            <div>Mode: {statusSystem.mode}</div>
            <div>Count down {countDownTime.toFixed(0)} min</div>
            <div>Loop count {loopCount ? loopCount : "null"}</div>
          </div>
          <div className="p-4  text-[12px]">
            <div className="">
              <div className="mr-10 mb-2">
                <label>Previous</label>
              </div>
              <div className="flex">
                
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
                        Update {new Date(el.timestamp).getDate()}/
                        {new Date(el.timestamp).getMonth() + 1}/
                        {new Date(el.timestamp).getFullYear()}{" "}
                        {new Date(el.timestamp).getHours()}:
                        {new Date(el.timestamp).getMinutes()}:
                        {new Date(el.timestamp).getSeconds()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 mt-3">
                      <div className="border-[1px] border-gray-500 p-2 w-[200px] rounded-lg text-center m-auto ">
                        <div>CO₂ (ppm)</div>
                        <div className="mt-10 text-[23px]">
                          {el.co2?.toFixed?.(2) ?? ""}
                        </div>
                      </div>
                      <div className="border-[1px] border-gray-500 p-2 w-[200px] rounded-lg text-center m-auto">
                        <div>Temperature (C)</div>
                        <div className="mt-10 text-[23px]">
                          {el.temperature?.toFixed?.(2) ?? ""}
                        </div>
                      </div>
                      <div className="border-[1px] border-gray-500 p-2 w-[200px] rounded-lg text-center m-auto">
                        <div>Humidity (%RH)</div>
                        <div className="mt-10 text-[23px]">
                          {el.humidity?.toFixed?.(2) ?? ""}%
                        </div>
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
              <HighchartsReact highcharts={Highcharts} options={optionsCo2} />
            </div>
          </div>
        </div>
        <div>
          <div className="p-4 text-[20px] font-semibold text-gray-100">
            CO₂-AP (ppm)
          </div>
          {/* Chart Card */}
          <div className="px-4 pb-8">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow p-4">
              <HighchartsReact highcharts={Highcharts} options={optionsApCo2} />
            </div>
          </div>
        </div>
        <div>
          <div className="p-4 text-[20px] font-semibold text-gray-100">
            Temperature (Celsius)
          </div>
          {/* Chart Card */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow p-4">
            <HighchartsReact highcharts={Highcharts} options={optionsTemp} />
          </div>
        </div>
        <div>
          <div className="p-4 text-[20px] font-semibold text-gray-100">
            Humidity (%RH)
          </div>
          {/* Chart Card */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow p-4">
            <HighchartsReact highcharts={Highcharts} options={optionsHumid} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
