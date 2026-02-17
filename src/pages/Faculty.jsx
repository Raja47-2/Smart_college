import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { getFaculty, deleteFaculty } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Faculty.css';

const Faculty = () => {
    const { user } = useAuth();
    const [faculty, setFaculty] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFaculty();
    }, []);

    const loadFaculty = async () => {
        try {
            const data = await getFaculty();
            setFaculty(data);
        } catch (error) {
            console.error("Failed to load faculty", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this faculty member?')) {
            await deleteFaculty(id);
            loadFaculty();
        }
    };

    const filteredFaculty = faculty.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAdmin = user?.role === 'admin';

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Faculty</h1>
                {isAdmin && (
                    <Link to="/faculty/add" className="btn btn-primary">
                        <Plus size={18} />
                        Add Faculty
                    </Link>
                )}
            </div>

            <div className="toolbar">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search faculty..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                {filteredFaculty.length === 0 ? (
                    <div className="empty-state">
                        <p>No faculty members found.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Designation</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFaculty.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.name}</td>
                                    <td>{item.email}</td>
                                    <td>{item.department}</td>
                                    <td>{item.designation}</td>
                                    {isAdmin && (
                                        <td className="actions-cell">
                                            <Link to={`/faculty/edit/${item.id}`} className="icon-btn edit">
                                                <Edit size={18} />
                                            </Link>
                                            <button onClick={() => handleDelete(item.id)} className="icon-btn delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Faculty;
