function App() {
  const username = "JaneDoe123";

  return (
    <div className="app">
      <h1>My Application</h1>
      <Header username={username} />
    </div>
  );
}

function Header({ username }) {
  return (
    <header>
      <nav>Menu</nav>
      <Icon username={username} />
    </header>
  );
}

function Icon({ username }) {
  return (
    <div className="icon-wrapper">
      <img src="avatar.png" alt="User" />
      <UserProfile username={username} />
    </div>
  );
}

function UserProfile({ username }) {
  return <span className="profile-name">Logged in as: {username}</span>;
}