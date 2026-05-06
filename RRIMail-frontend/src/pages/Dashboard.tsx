import { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import Layout from '../components/Layout';
import { CourierStats, FluxData, ServiceDistribution, UrgentCourier, AIInsight } from '../types/dashboard';
import '../styles/dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [stats, setStats] = useState<CourierStats>({
    entrant: 42,
    sortant: 28,
    enAttente: 15,
    enRetard: 6,
  });

  const [fluxData, setFluxData] = useState<FluxData[]>([
    { month: 'Jan', scolante: 30, rh: 25, finances: 15 },
    { month: 'Fév', scolante: 32, rh: 24, finances: 14 },
    { month: 'Mar', scolante: 28, rh: 26, finances: 12 },
    { month: 'Avr', scolante: 35, rh: 27, finances: 18 },
  ]);

  const [serviceDistribution] = useState<ServiceDistribution[]>([
    { name: 'Scolarité', value: 35, color: '#3B82F6' },
    { name: 'RH', value: 20, color: '#10B981' },
    { name: 'Finances', value: 15, color: '#F59E0B' },
    { name: 'Juridique', value: 10, color: '#8B5CF6' },
    { name: 'Informatique', value: 8, color: '#EF4444' },
  ]);

  const [urgentCouriers] = useState<UrgentCourier[]>([
    {
      id: '1',
      numero: 'CHR-2024-001',
      objet: 'Demande d\'inscription',
      expediteur: 'Bureau Registraire',
      echeance: '2024-05-10',
      priorite: 'Haute',
      statut: 'En cours',
    },
    {
      id: '2',
      numero: 'CHR-2024-002',
      objet: 'Rapport mensuel RH',
      expediteur: 'Direction RH',
      echeance: '2024-05-08',
      priorite: 'Critique',
      statut: 'En cours',
    },
  ]);

  const [aiInsight] = useState<AIInsight>({
    message:
      'Le temps de traitement moyen a diminué de 18% ce mois-ci. 3 courriers dépassent leur échéance et nécessitent une action immédiate. Le Service Scolarité traite 40% du volume total.',
    performance: true,
    retards: 3,
  });

  const lineChartData = {
    labels: fluxData.map((d) => d.month),
    datasets: [
      {
        label: 'Scolarité',
        data: fluxData.map((d) => d.scolante),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'RH',
        data: fluxData.map((d) => d.rh),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Finances',
        data: fluxData.map((d) => d.finances),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const doughnutChartData = {
    labels: serviceDistribution.map((s) => s.name),
    datasets: [
      {
        data: serviceDistribution.map((s) => s.value),
        backgroundColor: serviceDistribution.map((s) => s.color),
        borderColor: '#1F2937',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: '#9CA3AF',
          font: {
            size: 12,
            weight: '600',
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 60,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
    },
  };

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">Tableau de bord</h1>
            <p className="dashboard-subtitle">Vue d'ensemble de la gestion des courriers</p>
          </div>
          <div className="header-actions">
            <span className="courier-count">4 courriers à dispatcher</span>
            <button className="btn-dispatch">Dispatcher →</button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Courrier Entrant</span>
              <span className="stat-icon">📥</span>
            </div>
            <div className="stat-value">{stats.entrant}</div>
            <div className="stat-change positive">+12% vs mois dernier</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Courrier Sortant</span>
              <span className="stat-icon">📤</span>
            </div>
            <div className="stat-value">{stats.sortant}</div>
            <div className="stat-change positive">+5% vs mois dernier</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">En attente</span>
              <span className="stat-icon">⏳</span>
            </div>
            <div className="stat-value">{stats.enAttente}</div>
            <div className="stat-change">8 assignés, 7 en cours</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">En retard</span>
              <span className="stat-icon">⚠️</span>
            </div>
            <div className="stat-value">{stats.enRetard}</div>
            <div className="stat-change alert">Action requise</div>
          </div>
        </div>

        <div className="ai-insights">
          <div className="insights-icon">✨</div>
          <div className="insights-content">
            <h3 className="insights-title">Insights IA</h3>
            <p className="insights-message">{aiInsight.message}</p>
          </div>
          <div className="insights-badges">
            <span className={`badge ${aiInsight.performance ? 'success' : 'alert'}`}>
              {aiInsight.performance ? '✓ Performance ↑' : 'Alerte'}
            </span>
            <span className="badge alert">🔴 3 retards</span>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-title">Évolution du flux courrier</h3>
            <div className="chart-container">
              <Line data={lineChartData} options={chartOptions as any} />
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-title">Distribution par service</h3>
            <div className="chart-container doughnut-container">
              <Doughnut
                data={doughnutChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: '#9CA3AF',
                        font: { size: 12, weight: '600' },
                        padding: 15,
                      },
                    },
                  },
                } as any}
              />
            </div>
            <div className="distribution-legend">
              {serviceDistribution.map((service) => (
                <div key={service.name} className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: service.color }}
                  ></div>
                  <span className="legend-label">{service.name}</span>
                  <span className="legend-value">{service.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="urgent-section">
          <div className="urgent-header">
            <h3 className="urgent-title">⚠️ Courriers urgents à dispatcher</h3>
            <a href="/dispatcher" className="view-all">
              Voir tout →
            </a>
          </div>

          <div className="urgent-table">
            <table>
              <thead>
                <tr>
                  <th>N° Chrono</th>
                  <th>Objet</th>
                  <th>Expéditeur</th>
                  <th>Échéance</th>
                  <th>Priorité</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {urgentCouriers.map((courier) => (
                  <tr key={courier.id}>
                    <td className="courier-number">{courier.numero}</td>
                    <td>{courier.objet}</td>
                    <td>{courier.expediteur}</td>
                    <td>{new Date(courier.echeance).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <span
                        className={`priority-badge priority-${courier.priorite.toLowerCase()}`}
                      >
                        {courier.priorite}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge">{courier.statut}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
