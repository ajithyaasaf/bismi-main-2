import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import { Order } from '@shared/schema';

Chart.register(...registerables);

type TimeRange = '7days' | '30days' | '3months';

export default function SalesChart() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  
  const { data: orders = [] } = useQuery<Order[]>({ 
    queryKey: ['/api/orders'],
  });
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Determine date range based on selected time period
    const daysToShow = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    
    // Generate data for the selected period
    const days = Array.from({ length: daysToShow }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();
    
    // Format labels based on time range
    const dayLabels = days.map(day => {
      if (timeRange === '7days') {
        return day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      } else if (timeRange === '30days') {
        return day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        // For 3 months view, group by weeks or specific dates
        return day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    });
    
    const dailySales = days.map(day => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayOrders = orders.filter(order => {
        if (!order.date) return false;
        const orderDate = new Date(order.date);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });
      
      return dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    });
    
    // Calculate trend data
    const trendLine = calculateTrendLine(dailySales);
    
    // Get the primary color from CSS variables
    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary') || '#e11d48';
    
    // Create new chart
    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: dayLabels,
        datasets: [
          {
            label: 'Daily Sales (₹)',
            data: dailySales,
            backgroundColor: `${primaryColor}20`, // 20% opacity
            borderColor: primaryColor,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'white',
            pointBorderColor: primaryColor,
            pointBorderWidth: 2,
            pointRadius: timeRange === '7days' ? 4 : timeRange === '30days' ? 2 : 0,
            pointHoverRadius: 6
          },
          {
            label: 'Trend',
            data: trendLine,
            borderColor: `${primaryColor}80`, // 50% opacity
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.4,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#333',
            bodyColor: '#666',
            borderColor: '#ddd',
            borderWidth: 1,
            boxPadding: 8,
            cornerRadius: 8,
            callbacks: {
              label: (context) => `₹${context.raw}`,
              title: (tooltipItems) => {
                return `${tooltipItems[0].label}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              callback: (value) => `₹${value}`,
              font: {
                size: 10
              },
              color: '#666'
            },
            border: {
              dash: [4, 4]
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              },
              color: '#666',
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [orders, timeRange]);

  // Function to calculate a simple trend line
  const calculateTrendLine = (data: number[]): (number | null)[] => {
    if (data.length < 2) return Array(data.length).fill(null);
    
    // Simple linear regression
    const n = data.length;
    const sum_x = (n * (n - 1)) / 2; // Sum of x values (0, 1, 2, ..., n-1)
    const sum_y = data.reduce((a, b) => a + b, 0);
    const sum_xy = data.reduce((sum, y, i) => sum + (i * y), 0);
    const sum_xx = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of x^2 values
    
    const slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    const intercept = (sum_y - slope * sum_x) / n;
    
    // Generate trend line points
    return Array.from({ length: n }, (_, i) => intercept + slope * i);
  };

  return (
    <div style={{ height: '300px' }}>
      <canvas ref={chartRef} />
    </div>
  );
}
