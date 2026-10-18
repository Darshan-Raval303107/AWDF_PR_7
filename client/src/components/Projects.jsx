import React, { useState, useEffect } from 'react';
import { ExternalLink, Github, Search, X, Database, Server, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import './Projects.css';

// GitHub username to fetch repositories for (Practical 3)
const GITHUB_USERNAME = 'Darshan-Raval303107';
const API_URL = '/api/tasks';
const FALLBACK_URL = 'http://localhost:5001/api/tasks';

const Projects = ({ setActiveTab }) => {
  // Mode toggle: Default to Backend Tasks (Practical 6 requirement)
  const [dataSource, setDataSource] = useState('backend'); // 'backend' | 'github'
  const [backendTasks, setBackendTasks] = useState([]);
  const [repos, setRepos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch task data from own Node+MongoDB backend (Practical 6)
  const fetchBackendTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setBackendTasks([]);
        setError('Authentication required. Please log in via the Todo App tab to view backend tasks.');
        setLoading(false);
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      
      let res;
      try {
        res = await fetch(API_URL, { headers });
        if (!res.ok && res.status !== 401) res = await fetch(FALLBACK_URL, { headers });
      } catch {
        res = await fetch(FALLBACK_URL, { headers });
      }

      if (res.status === 401) {
        throw new Error('Authentication required. Please log in via the Todo App tab to view backend tasks.');
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch tasks from backend (Status: ${res.status})`);
      }

      const data = await res.json();
      setBackendTasks(data);
    } catch (err) {
      setError(err.message || 'Could not connect to MongoDB backend on port 5001');
    } finally {
      setLoading(false);
    }
  };

  // Fetch repositories from GitHub REST API (Practical 3)
  const fetchRepositories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch repositories (Status: ${response.status})`);
      }

      const data = await response.json();
      setRepos(data);
    } catch (err) {
      setError(err.message || 'Something went wrong while fetching GitHub data');
    } finally {
      setLoading(false);
    }
  };

  // Load data based on selected data source
  useEffect(() => {
    if (dataSource === 'backend') {
      fetchBackendTasks();
    } else {
      fetchRepositories();
    }
  }, [dataSource]);

  // Filter backend tasks
  const filteredTasks = backendTasks.filter((task) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter repositories
  const filteredRepos = repos.filter((repo) => {
    const query = searchTerm.toLowerCase();
    const nameMatches = repo.name.toLowerCase().includes(query);
    const langMatches = repo.language && repo.language.toLowerCase().includes(query);
    const descMatches = repo.description && repo.description.toLowerCase().includes(query);
    return nameMatches || langMatches || descMatches;
  });

  return (
    <section className="projects-section">
      {/* Header */}
      <div className="section-header text-center">
        <h2 className="section-title">
          {dataSource === 'backend' ? (
            <>
              Backend <span className="gradient-text">Task Data</span>
            </>
          ) : (
            <>
              GitHub <span className="gradient-text">Projects</span>
            </>
          )}
        </h2>
        <p className="section-subtitle">
          {dataSource === 'backend'
            ? 'Displaying dynamic task records fetched live from your Node+MongoDB backend (DB: AWDF_PR_7)'
            : 'Displaying repositories fetched from GitHub REST API (Practical 3)'}
        </p>

        {/* Data Source Toggle Tabs (Practical 6 vs Practical 3) */}
        <div className="data-source-switcher">
          <button
            className={`source-pill-btn ${dataSource === 'backend' ? 'active' : ''}`}
            onClick={() => setDataSource('backend')}
          >
            <Database size={15} />
            <span>Own Backend Tasks (Practical 6)</span>
          </button>
          <button
            className={`source-pill-btn ${dataSource === 'github' ? 'active' : ''}`}
            onClick={() => setDataSource('github')}
          >
            <Github size={15} />
            <span>GitHub Repos (Practical 3)</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-bar">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder={
              dataSource === 'backend'
                ? 'Search tasks by title...'
                : 'Search projects by name or language...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {!loading && !error && (
          <p className="search-count">
            {dataSource === 'backend'
              ? `Showing ${filteredTasks.length} of ${backendTasks.length} backend tasks`
              : `Showing ${filteredRepos.length} of ${repos.length} repositories`}
          </p>
        )}
      </div>

      {/* 1. Loading Spinner while request is in progress */}
      {loading && <LoadingSpinner />}

      {/* 2. Error Message if API call fails */}
      {!loading && error && (
        <ErrorMessage
          message={error}
          onRetry={dataSource === 'backend' ? fetchBackendTasks : fetchRepositories}
        />
      )}

      {/* 3. Content Display */}
      {!loading && !error && (
        <>
          {dataSource === 'backend' ? (
            /* Backend Tasks Display */
            filteredTasks.length > 0 ? (
              <div className="projects-grid">
                {filteredTasks.map((task) => {
                  const taskId = task.id || task._id;
                  const isCompleted = !!task.completed;

                  return (
                    <div key={taskId} className="project-card glass-card task-project-card">
                      <div className="project-details">
                        <div className="repo-header">
                          <h3 className="project-title flex-title">
                            {isCompleted ? (
                              <CheckCircle2 size={18} className="text-success inline-icon" />
                            ) : (
                              <Circle size={18} className="text-pending inline-icon" />
                            )}
                            <span>{task.title}</span>
                          </h3>
                          <span
                            className={`project-tag-badge ${
                              isCompleted ? 'badge-completed' : 'badge-pending'
                            }`}
                          >
                            {isCompleted ? 'Completed' : 'Pending'}
                          </span>
                        </div>

                        <p className="project-description task-meta-info">
                          <span>
                            <strong>DB:</strong> AWDF_PR_7
                          </span>{' '}
                          &bull;{' '}
                          <span>
                            <strong>Collection:</strong> tasks
                          </span>
                          <br />
                          <span className="mono-id">ID: {taskId}</span>
                        </p>

                        <div className="project-links">
                          {setActiveTab && (
                            <button
                              onClick={() => setActiveTab('Todo App')}
                              className="proj-link-btn solid-btn full-width"
                            >
                              Manage in To-Do UI <ArrowRight size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-results glass-card">
                <p className="no-results-text">
                  No tasks found in <strong>AWDF_PR_7</strong> database matching "
                  <strong>{searchTerm}</strong>"
                </p>
                <button className="clear-btn" onClick={() => setSearchTerm('')}>
                  Clear Search
                </button>
              </div>
            )
          ) : (
            /* GitHub Repositories Display (Original Practical 3) */
            filteredRepos.length > 0 ? (
              <div className="projects-grid">
                {filteredRepos.map((repo) => (
                  <div key={repo.id} className="project-card glass-card">
                    <div className="project-details">
                      <div className="repo-header">
                        <h3 className="project-title">{repo.name}</h3>
                        {repo.language && (
                          <span className="project-tag-badge">{repo.language}</span>
                        )}
                      </div>

                      <p className="project-description">
                        {repo.description || 'No description available for this repository.'}
                      </p>

                      <div className="project-links">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="proj-link-btn solid-btn"
                        >
                          <Github size={16} /> View Repo
                        </a>
                        {repo.homepage && (
                          <a
                            href={repo.homepage}
                            target="_blank"
                            rel="noreferrer"
                            className="proj-link-btn outline-btn"
                          >
                            <ExternalLink size={16} /> Live Demo
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results glass-card">
                <p className="no-results-text">
                  No projects found matching "<strong>{searchTerm}</strong>"
                </p>
                <button className="clear-btn" onClick={() => setSearchTerm('')}>
                  Clear Search
                </button>
              </div>
            )
          )}
        </>
      )}
    </section>
  );
};

export default Projects;
