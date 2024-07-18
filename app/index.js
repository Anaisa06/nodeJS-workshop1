// Auth class
class Auth {
  // Static method to log in a user
  static async login(user) {     
    // Generate a token
    const token = Auth.generateToken();

    // Store the token and user information in local storage
    localStorage.setItem('token', token);
    localStorage.setItem('userId', user.id);
          
  }

  // Static method to log out a user
  static logout() {
    // Remove the token and user information from local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Static method to generate a token
  static generateToken() {
    // Generate a random 36-character string
    return Math.random().toString(36).substr(2);
  }
}

// UsuarioRegular class
class UsuarioRegular {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

  // Method to register the user as a regular user
  async registrarseComoUsuarioRegular() {
    // Implement registration logic
      const newUser = await fetchApi('http://localhost:3000/users', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              name: this.name,
              email: this.email,
              role: 'regular'
          })                   
      });
      alert('Usuario registrado');
    console.log(`${this.name} se ha registrado como usuario regular`);
  }

  async hacerReserva(roomId){
      await fetchApi('http://localhost:3000/bookings', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              roomId,
              nombreUsuario: this.name
          })
      })
  }
}

// Administrador class
class Administrador {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

  // Method to create an admin user
  async crearUsuarioAdmin(adminName, adminEmail) {

    await fetchApi('http://localhost:3000/users', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          role: 'admin'
      })                   
  })
    console.log(`${this.name} ha creado un nuevo usuario admin`);
  }

  async hacerReservaAdmin(roomId, userName){
      await fetchApi('http://localhost:3000/bookings', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              roomId,
              nombreUsuario: userName
          })
      })
  }

  async deleteRoom(roomId) {
    await fetchApi(`http://localhost:3000/rooms/${roomId}`, {
      method: 'DELETE'
    })
  }
}

const fetchApi = async (url, options) => {
  try {
      const response = await fetch (url, options);
      const data = await response.json();
      return data;
  } catch (error) {
      throw new Error('Error in fetch: ', error);
  }
}

const root = document.getElementById('root');

document.addEventListener('DOMContentLoaded', () => {
  loginScene();
})


const loginScene = () => {
  
  root.innerHTML = `
  <form>
    <input type="text" id="email-input" placeholder="email">
    <input type="submit" id="login-button" value="Login">
    <button type="button" id="register-button">Register</button>
  </form>
  `;

  const $userEmail = document.getElementById('email-input');
  const $loginButton = document.getElementById('login-button');
  $loginButton.addEventListener('click', async event => {
    event.preventDefault();
    const user = await fetchApi(`http://localhost:3000/users?email=${$userEmail.value}`);
    
    if (user[0]){
      Auth.login(user[0]);
      dashboardScene()
    } else {
      alert('usuario no encontrado');
    }
  })

  const $registerButton = document.getElementById('register-button');
  $registerButton.addEventListener('click', event => {
    event.preventDefault();
    registerScene();
  })
}

const registerScene = () => {
  root.innerHTML = `
    <form>
      <input type="text" id="name" placeholder="nombre">
      <input type="text" id="email" placeholder="email">
      <input type="submit" id="register" value="Register">
    </form>
  `
  const $name = document.getElementById('name');
  const $email = document.getElementById('email');
  const $register = document.getElementById('register');

  $register.addEventListener('click', event => {
    event.preventDefault();
    const newUser = new UsuarioRegular($name.value, $email.value);
    newUser.registrarseComoUsuarioRegular();
    loginScene();
  })
}

const dashboardScene = async () => {
  root.innerHTML = `
  <h1>Habitaciones</h1>
  <button type="button" id="logout-button">Log Out</button>
  <div id="container"></div>
  `

  const $logoutButton = document.getElementById('logout-button');
  $logoutButton.addEventListener('click', event => {
    event.preventDefault();
    Auth.logout();
    loginScene();
  })

  //render rooms
  const userId = localStorage.getItem('userId');
  const user = await fetchApi(`http://localhost:3000/users/${userId}`)
  const $container = document.getElementById('container');
  const rooms = await fetchApi('http://localhost:3000/rooms');
  rooms.forEach(room => {
    const $card = document.createElement('DIV');
    $card.innerHTML = `
    <hr>
    <h3>${room.name}</h3>
    <p>Capacidad: ${room.capacity}</p>
     `
    const $buttons = document.getElementById('buttons');
     //if user is admin
    if (user.role === 'admin') {  

      //book button
      const $bookButtonAdmin = document.createElement('BUTTON');
      $bookButtonAdmin.innerText = "Reservar";
      $card.appendChild($bookButtonAdmin);
            
      //delete button
      const $deleteButton = document.createElement('BUTTON');
      $deleteButton.innerText = 'Eliminar';
      $card.appendChild($deleteButton);

      const userAdmin = new Administrador(user.name, user.email);

      //delete room
      $deleteButton.addEventListener('click', event => {
        event.preventDefault();
        userAdmin.deleteRoom(room.id);
        alert('habitación eliminada')
        dashboardScene();        
      })

      $bookButtonAdmin.addEventListener('click', async event => {
        event.preventDefault();
        const bookingUserEmail = prompt('Ingresa el email del usuario para hacer la reserva');
        const bookingUser = await fetchApi(`http://localhost:3000/users?email=${bookingUserEmail}`);
        userAdmin.hacerReservaAdmin(room.id, bookingUser[0].name);
        alert('reserva realizada con éxito')
        dashboardScene();
      })
    } else {
      const $bookButton = document.createElement('BUTTON');
      $bookButton.innerText = "Reservar";
      $card.appendChild($bookButton);
      $bookButton.addEventListener('click', async event => {   
        event.preventDefault();   
        const regularUser = new UsuarioRegular(user.name, user.email);
        regularUser.hacerReserva(room.id);
        alert('reserva realizada con éxito');  
        dashboardScene();
    })  
    }
    $container.appendChild($card);  
    
  })
}
 