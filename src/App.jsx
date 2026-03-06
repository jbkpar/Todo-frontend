import { useState, useEffect } from "react";
import "./App.css";

const API = "https://todo-backend-production-dca6.up.railway.app/api";

export default function App() {
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [view, setView] = useState("login"); // "login" | "register" | "todos"
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [authError, setAuthError] = useState("");

    const [todos, setTodos] = useState([]);
    const [title, setTitle] = useState("");

    useEffect(() => {
        if (token) {
            setView("todos");
            fetchTodos();
        }
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Auth ──────────────────────────────────────────

    async function register() {
        setAuthError("");
        const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
            const data = await res.json();
            saveToken(data.token);
        } else {
            const msg = await res.text();
            setAuthError(msg || "Registration failed");
        }
    }

    async function login() {
        setAuthError("");
        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
            const data = await res.json();
            saveToken(data.token);
        } else {
            setAuthError("Invalid username or password");
        }
    }

    function saveToken(t) {
        localStorage.setItem("token", t);
        setToken(t);
        setView("todos");
    }

    function logout() {
        localStorage.removeItem("token");
        setToken("");
        setTodos([]);
        setUsername("");
        setPassword("");
        setView("login");
    }

    // ── Todos ─────────────────────────────────────────

    function authHeaders() {
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    }

    async function fetchTodos() {
        const res = await fetch(`${API}/todos`, { headers: authHeaders() });
        if (res.status === 401) { logout(); return; }
        const data = await res.json();
        setTodos(data);
    }

    async function addTodo() {
        if (!title.trim()) return;
        await fetch(`${API}/todos`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ title, completed: false }),
        });
        setTitle("");
        fetchTodos();
    }

    async function toggleTodo(todo) {
        await fetch(`${API}/todos/${todo.id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ ...todo, completed: !todo.completed }),
        });
        fetchTodos();
    }

    async function deleteTodo(id) {
        await fetch(`${API}/todos/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        });
        fetchTodos();
    }

    const completed = todos.filter(t => t.completed).length;
    const total = todos.length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    // ── Auth screen ───────────────────────────────────

    if (view === "login" || view === "register") {
        return (
            <div className="auth-wrap">
                <div className="auth-card">
                    <div className="auth-logo">✦</div>
                    <h1 className="auth-title">
                        {view === "login" ? "Welcome back" : "Create account"}
                    </h1>
                    <p className="auth-subtitle">
                        {view === "login" ? "Sign in to your workspace" : "Start your todo journey"}
                    </p>

                    <div className="auth-fields">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && (view === "login" ? login() : register())}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && (view === "login" ? login() : register())}
                        />
                    </div>

                    {authError && <div className="auth-error">{authError}</div>}

                    <button
                        className="auth-btn"
                        onClick={view === "login" ? login : register}
                    >
                        {view === "login" ? "Sign in" : "Create account"}
                    </button>

                    <div className="auth-switch">
                        {view === "login" ? (
                            <>No account? <span onClick={() => { setAuthError(""); setView("register"); }}>Register</span></>
                        ) : (
                            <>Have an account? <span onClick={() => { setAuthError(""); setView("login"); }}>Sign in</span></>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Todo screen ───────────────────────────────────

    return (
        <div className="app">
            <div className="header">
                <div>
                    <div className="eyebrow">My workspace</div>
                    <h1>Tasks</h1>
                    <p className="subtitle">Stay focused, get things done.</p>
                </div>
                <button className="logout-btn" onClick={logout}>Sign out</button>
            </div>

            {total > 0 && (
                <div className="progress-section">
                    <div className="progress-meta">
                        <span className="progress-label">Completion</span>
                        <span className="progress-count">{completed}/{total}</span>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            <div className="input-row">
                <div className="input-wrap">
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addTodo()}
                        placeholder="Add a new task..."
                    />
                </div>
                <button className="add-btn" onClick={addTodo}>+ Add</button>
            </div>

            {todos.length === 0 ? (
                <div className="empty">
                    <span className="empty-icon">✦</span>
                    <p>No tasks yet — add one above</p>
                </div>
            ) : (
                <>
                    {todos.filter(t => !t.completed).length > 0 && (
                        <>
                            <div className="section-label">To do</div>
                            <div className="todo-list">
                                {todos.filter(t => !t.completed).map(todo => (
                                    <div key={todo.id} className="todo-item" onClick={() => toggleTodo(todo)}>
                                        <div className="checkbox"><span className="checkmark">✓</span></div>
                                        <span className="todo-title">{todo.title}</span>
                                        <button className="delete-btn" onClick={e => { e.stopPropagation(); deleteTodo(todo.id); }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {todos.filter(t => t.completed).length > 0 && (
                        <>
                            <div className="section-label completed-label">Completed</div>
                            <div className="todo-list">
                                {todos.filter(t => t.completed).map(todo => (
                                    <div key={todo.id} className="todo-item done" onClick={() => toggleTodo(todo)}>
                                        <div className="checkbox"><span className="checkmark">✓</span></div>
                                        <span className="todo-title">{todo.title}</span>
                                        <button className="delete-btn" onClick={e => { e.stopPropagation(); deleteTodo(todo.id); }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {completed === total && total > 0 && (
                        <div className="all-done">✦ All tasks complete — great work!</div>
                    )}
                </>
            )}
        </div>
    );
}