import { useState, useEffect } from "react";
import Service from '../types/Service';
import Log from "../types/Log";
import LogDaySummary from "../types/LogDaySummary";
import { Status } from "../../utils/constants";

function useServices() {
    const [data, setData] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState();

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch("./urls.cfg");
                const configText = await response.text();
                const configLines = configText.split("\n");

                const services: Service[] = []
                for (let ii = 0; ii < configLines.length; ii++) {
                    const configLine = configLines[ii];
                    const [key, url] = configLine.split("=");
                    if (!key || !url) {
                        continue;
                    }
                    const log = await logs(key);

                    if (log.length > 0) {
                        services.push({ id: ii, name: key, status: log[log.length - 1].status, logs: log })
                    } else {
                        services.push({ id: ii, name: key, status: "unknown", logs: log })
                    }
                }
                setData(services as Service[]);
            } catch (e: any) {
                setError(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    return [data, isLoading, error];
}

async function logs(key: string): Promise<LogDaySummary[]> {
    const response = await fetch(`https://raw.githubusercontent.com/lumonic-inc/status/master/public/status/${key}_report.log`);

    const text = await response.text();
    const lines = text.split("\n");
    const logs: Log[] = [];
    const logDaySummary: LogDaySummary[] = [];
    lines.forEach((line: string) => {
        const [created_at, status, response_time] = line.split(", ");
        logs.push({ id: created_at, response_time, status, created_at })
    })

    const prepareSummary = Object.values(logs.reduce((r: any, date) => {
        const [year, month, day] = date.created_at.substr(0, 10).split('-');
        const key = `${day}_${month}_${year}`;
        r[key] = r[key] || { date: date.created_at, logs: [] };
        r[key].logs.push(date);
        return r;
    }, {}));


    prepareSummary.forEach((logSummary: any) => {
        var avg_response_time = 0

        logSummary.logs.forEach((log: Log) => {
            if (log.response_time) {
                avg_response_time += Number(log.response_time.replaceAll('s', ''));
            }
        });

        let status = ""
        if (logSummary.logs.length === 0) {
            status = "unknown"
        } else if (logSummary.logs.every((item:any)=> item.status === 'success')) {
            status = Status.OPERATIONAL
        } else if (logSummary.logs.every((item:any)=> item.status === 'failed')) {
            status = Status.OUTAGE
        } else {
            status = Status.PARTIAL_OUTAGE
        }

        logDaySummary.push({
            avg_response_time: avg_response_time / logSummary.logs.length,
            current_status: logSummary.logs[logSummary.logs.length - 1].status,
            date: logSummary.date.substr(0, 10),
            status: status
        })
    })


    return fillData(logDaySummary);
}

function fillData(data: LogDaySummary[]): LogDaySummary[] {
    const logDaySummary = [];
    var today = new Date();
    for (var i = -1; i < 89; i += 1) {
        // Create a new date for the ith day
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        d.setHours(0, 0, 0, 0);  // Reset hours, minutes, seconds, and milliseconds

        // Check if the date d is greater than today
        if (d > today) {
            continue; // Skip this loop iteration
        }

        // Format the date as YYYY-MM-DD without converting to UTC
        const localDateISOString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        // Find the corresponding summary for the given date
        const summary = data.find((item) => item.date === localDateISOString);
        // Push a new object with either the found summary or default values
        logDaySummary.push({
            avg_response_time: summary?.avg_response_time || 0,
            current_status: summary?.current_status || "unknown",
            date: localDateISOString,
            status: summary?.status || "unknown"
        });
    }

    // Since the dates were pushed starting from yesterday going back, we reverse the array to start from the farthest date
    return logDaySummary.reverse();
}

export default useServices;
