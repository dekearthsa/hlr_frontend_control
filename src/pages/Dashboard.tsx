import { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

const Dashboard = () => {
  // ── Mock data
  const { categories, series } = useMemo(() => {
    const now = Date.now();
    const step = 60 * 1000; // 1 นาที
    const points = 30;

    const cats: number[] = [];
    for (let i = points - 1; i >= 0; i--) {
      cats.push(now - i * step);
    }

    const sin = (i: number) => 400 + 40 * Math.sin(i / 3);
    const noise = (n: number) => n + (Math.random() - 0.5) * 8;

    const s1 = cats.map((_, i) => Math.round(noise(sin(i))));
    const s2 = cats.map((_, i) =>
      Math.round(noise(380 + 35 * Math.cos(i / 2.5)))
    );
    const s3 = cats.map((_, i) =>
      Math.round(noise(360 + 25 * Math.sin(i / 2) + 10))
    );
    const s4 = cats.map((_, i) =>
      Math.round(noise(420 + 20 * Math.cos(i / 4)))
    );

    return {
      categories: cats,
      series: [
        { name: "Co2 Calibrate", data: s1 },
        { name: "Co2 Outlet", data: s2 },
        { name: "Co2 Inlet", data: s3 },
        { name: "Co2 Regen", data: s4 },
      ],
    };
  }, []);

  // ── Chart options (Dark Mode)
  const options: ApexOptions = {
    theme: { mode: "dark" },
    chart: {
      id: "co2-line",
      type: "line",
      height: 360,
      background: "transparent",
      animations: { enabled: true, easing: "easeinout", speed: 500 },
      toolbar: {
        show: true,
        tools: {
          download: true,
          zoom: true,
          selection: true,
          pan: true,
          reset: true,
        },
      },
      zoom: { enabled: true },
      foreColor: "#cbd5e1", // slate-300
    },
    stroke: { curve: "smooth", width: 2 },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      type: "datetime",
      categories,
      labels: { datetimeUTC: false, style: { colors: "#94a3b8" } }, // slate-400
      axisBorder: { color: "#334155" }, // slate-700
      axisTicks: { color: "#334155" },
      tooltip: { enabled: false },
    },
    yaxis: {
      title: { text: "CO₂ (ppm)", style: { color: "#cbd5e1" } },
      decimalsInFloat: 0,
      min: 300,
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
      shared: true,
      x: { format: "HH:mm" },
    },
    grid: { borderColor: "#334155" }, // เส้นกริดสีอ่อนในโทนมืด
    // ถ้าต้องการ palette เข้มหน่อย (เลือกเองได้)
    colors: ["#60a5fa", "#34d399", "#fbbf24", "#f472b6"],
  };

  return (
    <div className="ml-[4%] min-h-screen  flex justify-center  bg-gray-950 text-gray-100">
      <div className="w-[85%] mt-10 border-[1px] border-gray-500 p-3 mb-10 rounded-lg">
        <div>
          <div className="p-4 text-[20px] font-semibold text-gray-100">
            CO2 (ppm)
          </div>
          {/* Chart Card */}
          <div className="px-4 pb-8">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow p-4">
              <ReactApexChart
                options={options}
                series={series}
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
          <div className="px-4 pb-8">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow p-4">
              <ReactApexChart
                options={options}
                series={series}
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
          <div className="px-4 pb-8">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow p-4">
              <ReactApexChart
                options={options}
                series={series}
                type="line"
                height={360}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
