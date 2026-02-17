import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDashboardStats, getStudents } from '../services/api';
import './Analytics.css';

const Analytics = () => {
    const [stats, setStats] = useState({ students: 0, faculty: 0, feesPending: 0 });
    const [courseDistribution, setCourseDistribution] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [dashboardStats, studentsList] = await Promise.all([
                getDashboardStats(),
                getStudents()
            ]);
            setStats(dashboardStats);

            // Process students for charts
            const courses = {};
            studentsList.forEach(s => {
                courses[s.course] = (courses[s.course] || 0) + 1;
            });

            const chartData = Object.keys(courses).map(course => ({
                name: course,
                Count: courses[course]
            }));
            setCourseDistribution(chartData);

        } catch (error) {
            console.error("Error loading analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Analytics Dashboard</h1>
            </div>

            <div className="analytics-grid">
                <div className="chart-card">
                    <h3>Course Distribution</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={courseDistribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Count" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Overall Stats</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Students', value: stats.students },
                                        { name: 'Faculty', value: stats.faculty }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label
                                >
                                    {
                                        [0, 1].map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
                                    }
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
