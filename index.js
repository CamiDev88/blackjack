// Tomamos los elementos del DOM
var tablero = document.querySelector('#tablero tbody');
var tableroCroupier = document.querySelector('#croupier');
var botonNuevoJugador = document.querySelector('#nuevoJugador');
var botonNuevaPartida = document.querySelector('#nuevaPartida');
var reloj = document.querySelector('#reloj');

// Definimos una variable timer, un tiempo y una de chequeo de tiempo
var timer;
var tiempo;
var timeCheckInterval;

// Cargamos eventos en los botones
botonNuevoJugador.addEventListener('click', ingresarJugador);
botonNuevaPartida.addEventListener('click', comenzarPartida);

// Dejamos la baraja mezclada
mezclarCartas();

// Inicializamos el tablero sin jugadores (puestos libres)
inicializarTablero();

// Esperamos las acciones del usuario