function ingresarJugador(){
	let callback = function(){
		const nuevoJugador = document.querySelector('#modal input').value;

		if(nuevoJugador == ''){
			modal.alert('Por favor, ingrese un nombre');
		}
		else{
			function obtenerPrimeraPosicionLibre(jugador){
				return jugador == null;
			}

			// Obtenemos la primera posición libre
			let posicion = jugadores.findIndex(obtenerPrimeraPosicionLibre);

			jugadores[posicion] = {
				nombre: nuevoJugador,
				apuesta: 0,
				dinero: 900,
				cartas: [],
				acciones: {
					pedirCarta: false,
					plantarse: false,
					doblar: false,
					separar: false,
					salir: true
				},
				posiblesResultados: null,
				puntuacion: null,
				resultadoFinal: null
			}

			// Actualizamos el tablero
			actualizarTablero();

			// Si no hay más posiciones libres, lanzamos el aviso de que se alcanzó el máximo de jugadores permitidos
			// y deshabilitamos el botón para agregar jugadores
			if(jugadores.findIndex(obtenerPrimeraPosicionLibre) == -1){
				botonNuevoJugador.disabled = true;

				modal.alert('Se alcanzó el máximo permitido de jugadores');
			}
		}
	}

	modal.prompt('Ingrese su nombre', callback);
}

function abandonarPartida(indexJugador){
	jugadores[indexJugador] = null;

	botonNuevoJugador.disabled = false;

	actualizarTablero();
}

function mezclarCartas(){
	return cartas.sort(function() { return 0.5 - Math.random() });
}

function apostar(indexJugador){
	deshabilitarBotones();

	let jugador = jugadores[indexJugador];

	function concluirApuesta(){
		clearInterval(timeCheckInterval);
		clearInterval(timer);

		reloj.innerHTML = '';

		if(indexJugador < (jugadores.length - 1)){
			apostar(indexJugador + 1);
		}
		else{
			// Chequeamos si hubo apuestas
			let apostadores = jugadores.filter(jugador => (jugador != null) && (jugador.apuesta > 0));

			if(apostadores.length != 0){
				// Repartimos 2 cartas a cada jugador
				repartir(2, apostadores);

				// El croupier se reparte 1 carta
				croupier.cartas.push(cartas.shift());

				// Análisis previo
				jugadores.forEach(function(jugador, index){
					if(jugador != null){
						analizarJugada(index);
					}
				});

				// Comienza el juego
				jugar(0);
			}
			else{
				modal.hide();

				habilitarBotones();
			}
		}
	}

	if(jugador !== null){
		// Ponemos el timer
		ponerTimer();

		// Activamos el chequeo de tiempo
		timeCheckInterval = setInterval(function(){
			// Si se acabó el tiempo y hay más jugadores, pasamos al siguiente jugador
			// sino, comenzamos la jugada
			if(chequearTiempo()){
				concluirApuesta();
			}
		}, 1000);

		// Función callback para cuando realice su apuesta
		const callback = function(){
			let apuesta = document.querySelector('#modal input').value;

			let patron = /^[0-9]+$/;

			if(apuesta == '' || !patron.test(apuesta)){
				concluirApuesta();
			}
			else{
				apuesta = parseInt(apuesta);

				if(apuesta < 0){
					concluirApuesta();
				}
				else{
					if(apuesta > jugador.dinero){
						concluirApuesta();
					}
					else{
						jugador.apuesta = apuesta;
						jugador.dinero = jugador.dinero - apuesta;

						concluirApuesta();
					}
				}
			}
		}

		modal.prompt(jugador.nombre + ' realice su apuesta:', callback);
	}
	else{
		concluirApuesta();
	}
}

function repartir(cantidad, jugadores){
	// Repartimos a cada jugador recibido por parámetro una cantidad determinada (sacando una carta de la pila)
	jugadores.forEach(function(jugador){
		if(jugador !== null){
			for(let i = 0; i < cantidad; i++){
				jugador.cartas.push(cartas.shift());
			}
		}
	});
}

function comenzarPartida(){
	reiniciar();

	function chequearSiHayJugadores(jugador){
		return jugador !== null;
	}

	// Chequeamos si existen jugadores, sino lanzamos el aviso de que deberán sumarse jugadores
	if(jugadores.findIndex(chequearSiHayJugadores) == -1){
		modal.alert('Para poder jugar, agregue uno o varios jugadores');
	}
	else{
		// Comenzamos las apuestas
		apostar(0);
	}
}

function chequearPosiblesResultados(cartasJugador){
	// Array de posibles resultados
	let resultados = [];

	// Obtenemos la suma fija sin los ases
	let sinAses = cartasJugador.filter(carta => carta.nombre != 'As');
	let fijo = sumarCartas(sinAses);

	// Obtenemos los ases
	let ases = cartasJugador.filter(carta => carta.nombre == 'As');

	if(ases.length == 0){
		resultados.push(fijo);
	}
	else{
		// Contemplamos todas las posibilidades
		for(let i = 0; i < ases.length; i++){
			if(ases.length > 1){
				for(let j = 0; j < ases.length; j++){
					if(i != j){
						resultados.push(fijo + ases[i].valores[0] + ases[j].valores[0]);
						resultados.push(fijo + ases[i].valores[0] + ases[j].valores[1]);
						resultados.push(fijo + ases[i].valores[1] + ases[j].valores[0]);
						resultados.push(fijo + ases[i].valores[1] + ases[j].valores[1]);
					}
				}
			}
			else{
				resultados.push(fijo + ases[i].valores[0]);
				resultados.push(fijo + ases[i].valores[1]);
			}
		}
	}

	return resultados;
}

function chequearBlackJack(cartasJugador){
	let blackJack = false;

	if(cartasJugador.length == 2){
		// Contemplamos todas las posibilidades
		for(let i = 0; i < cartasJugador.length; i++){
			for(let j = 0; j < cartasJugador.length; j++){
				if(i != j){
					if(cartasJugador[i].nombre == 'As' && cartasJugador[j].valores[0] == 10){
						blackJack = true;

						break;
					}

					if(cartasJugador[j].nombre == 'As' && cartasJugador[i].valores[0] == 10){
						blackJack = true;

						break;
					}				
				}
			}
		}
	}

	return blackJack;
}

function analizarJugada(indexJugador){
	let jugador = jugadores[indexJugador];

	if(jugador != null){
		if(jugador.cartas.length > 0){
			// Función para chequear si el croupier develó su segunda carta
			let croupierDeveloSegundaCarta = (croupier.cartas.length > 1) ? true : false;

			// Función para ver si se pasó
			function obtenerResultadoMenorA21(resultado){
				return resultado < 21;
			}

			// Chequeamos si hay BlackJack
			if(chequearBlackJack(jugador.cartas)){
				jugador.resultadoFinal = 'BlackJack';

				// Si el croupier ya develó su segunda carta, chequeamos si obtuvo BlackJack, en cuyo caso hay un empate
				if(croupierDeveloSegundaCarta){
					if(chequearBlackJack(croupier.cartas)){
						jugador.resultadoFinal = 'Empató';
					}
				}
			}
			else{
				let resultadosJugador = chequearPosiblesResultados(jugador.cartas);

				// Ordenamos los resultados del jugador, de menor a mayor y de mayor a menor	
				let minToMaxResJugador = resultadosJugador.sort();		
				let maxToMinResJugador = minToMaxResJugador.reverse();

				// Chequeamos si se pasó
				let jugadorSePaso = resultadosJugador.find(obtenerResultadoMenorA21);

				// Si no hay resultados menores a 21, avisamos que se pasó
				if(jugadorSePaso == undefined){
					jugador.resultadoFinal = 'Se pasó';

					// Calculamos la puntuación
					for (let i = 0; i < minToMaxResJugador.length; i++) {
						if(minToMaxResJugador[i] > 21){
							jugador.puntuacion = minToMaxResJugador[i];

							break;
						}
					}
				}
				else{
					// Chequeamos si sacó 21
					if(resultadosJugador.indexOf(21) != -1){
						jugador.resultadoFinal = 'Ganó';

						// Si el croupier ya develó su segunda carta, chequeamos si hubo empate
						if(resultadosCroupier.indexOf(21) != -1){
							jugador.resultadoFinal = 'Empató';
						}
					}
					else{
						// Si el croupier ya develó su segunda carta, analizamos si el jugador ganó, empató o perdió
						if(croupierDeveloSegundaCarta){
							let resultadosCroupier = chequearPosiblesResultados(croupier.cartas);

							// Calculamos la puntuación del jugador
							for (let i = 0; i < maxToMinResJugador.length; i++) {
								if(maxToMinResJugador[i] < 21){
									jugador.puntuacion = maxToMinResJugador[i];

									break;
								}
							}

							// Chequeamos si el croupier se pasó
							let croupierSePaso = resultadosCroupier.find(obtenerResultadoMenorA21);

							if(croupierSePaso == undefined){
								jugador.resultadoFinal = 'Ganó';
							}
							else{
								// Chequeamos si hubo empate
								// Calculamos la puntuacion del croupier
								let maxToMinResCroupier = resultadosCroupier.sort().reverse();
								let maxResCroupier = 0;								

								for (let i = 0; i < maxToMinResCroupier.length; i++) {
									if(maxToMinResCroupier[i] < 21){
										maxResCroupier = maxToMinResCroupier[i];

										break;
									}
								}

								if(maxResCroupier == jugador.puntuacion){
									jugador.resultadoFinal = "Empató";
								}
								else if(maxResCroupier < jugador.puntuacion){
									jugador.resultadoFinal = 'Ganó';
								}
								else{
									jugador.resultadoFinal = 'Perdió';
								}
							}
						}
					}
				}
			}
		}
	}
}

function otorgarPremios(){
	jugadores.forEach(function(jugador){
		if(jugador != null){
			switch(jugador.resultadoFinal){
				case 'BlackJack':
					jugador.dinero = jugador.dinero + (jugador.apuesta * 2.5);
				break;

				case 'Ganó':
					jugador.dinero = jugador.dinero + (jugador.apuesta * 2);
				break;

				case 'Empató':

					jugador.dinero = jugador.dinero + jugador.apuesta;

				break;

				case 'Perdió':
				default:

				break;
			}

			jugador.apuesta = 0;
		}
	});
}

function jugar(indexJugador){
	let jugador = jugadores[indexJugador];

	if(jugador !== null){
		if(jugador.apuesta != 0){
			if(jugador.resultadoFinal == 'BlackJack' || jugador.puntuacion == 21){
				concluirJugada(indexJugador);
			}
			else{
				// Ponemos el timer
				ponerTimer();

				// Activamos el chequeo de tiempo
				timeCheckInterval = setInterval(function(){
					// Si se acabó el tiempo y hay más jugadores, pasamos al siguiente jugador
					// sino, analizamos la jugada
					if(chequearTiempo()){
						concluirJugada(indexJugador);
					}
				}, 1000);

				habilitarAcciones(indexJugador);

				actualizarTablero();
			}
		}
		else{
			concluirJugada(indexJugador);
		}
	}
	else{
		concluirJugada(indexJugador);
	}
}

function concluirJugada(indexJugador){
	let jugador = jugadores[indexJugador];

	clearInterval(timeCheckInterval);
	clearInterval(timer);

	reloj.innerHTML = '';

	if(indexJugador < (jugadores.length - 1)){
		jugar(indexJugador + 1);
	}
	else{
		// El croupier se reparte otra carta
		croupier.cartas.push(cartas.shift());

		jugadores.forEach(function(jugador, index){
			if(jugador != null){
				analizarJugada(index);
			}
		});

		otorgarPremios();

		habilitarBotones();
	}

	if(jugador !== null){
		deshabilitarAcciones(indexJugador);

		actualizarTablero();
	}	
}

function ponerTimer(){
	let finalTime = new Date();
	finalTime.setSeconds(finalTime.getSeconds() + 17);
	finalTime = finalTime.getTime();

	timer = setInterval(function(){
		// Obtener el tiempo actual
		let currentTime = new Date().getTime();

		// Obtenemos la distancia entre el tiempo actual y el final
		tiempo = finalTime - currentTime;

		// Calculamos los minutos y segundos
		var segundos = ('0' + Math.floor((tiempo % (1000 * 60)) / 1000)).slice(-2);

		reloj.innerHTML = segundos+' segundos';

		if (tiempo < 0) {
    		clearInterval(timer);

    		reloj.innerHTML = '';
    	}
	}, 1000);
}

function sumarCartas(cartasJugador){
	let suma = 0;

	cartasJugador.forEach(function(carta){
		if(carta.nombre != 'As'){
			suma += carta.valores[0];
		}
	});

	return suma;
}

function habilitarAcciones(indexJugador){
	let jugador = jugadores[indexJugador];

	// Acción pedir carta
	jugador.acciones.pedirCarta = true;

	// Accion plantarse
	jugador.acciones.plantarse = true;

	// Acción doblar
	if((jugador.apuesta * 2) <= jugador.dinero){
		jugador.acciones.doblar = true;
	}

	// Acción separar
	jugador.acciones.separar = true;

	// Señalar jugador en tablero
	tablero.childNodes[indexJugador].style.backgroundColor = '#061A30';
	tablero.childNodes[indexJugador].style.color = '#FFF';
}

function deshabilitarAcciones(indexJugador){
	let jugador = jugadores[indexJugador];

	// Acción pedir carta
	jugador.acciones.pedirCarta = false;

	// Accion plantarse
	jugador.acciones.plantarse = false;

	// Acción doblar
	jugador.acciones.doblar = false;

	// Acción separar
	jugador.acciones.separar = false;

	// Desmarcar jugador en tablero
	tablero.childNodes[indexJugador].style.backgroundColor = 'rgba(0,0,0,.05)';
	tablero.childNodes[indexJugador].style.color = '#061A30';
}

function aplicarAccion(indexJugador, accion){
	let jugador = jugadores[indexJugador];

	switch(accion){
		case 'pedirCarta':
			repartir(1, [jugador]);
			
			analizarJugada(indexJugador);

			if(jugador.puntuacion == 21 || jugador.resultadoFinal == 'Se pasó'){
				concluirJugada(indexJugador);
			}
		break;

		case 'plantarse':
			concluirJugada(indexJugador);
		break;

		case 'doblar':
			if(jugador.apuesta <= jugador.dinero){
				jugador.dinero = jugador.dinero - jugador.apuesta;
				jugador.apuesta = jugador.apuesta * 2;

				jugador.acciones.doblar = false;

				aplicarAccion(indexJugador, 'pedirCarta');
			}
		break;

		case 'separar':

		break;
	}

	actualizarTablero();
}

function chequearTiempo(){
	let outOfTime = false;

	if(tiempo < 0){
    	outOfTime = true;
	}

	return outOfTime;
}

function inicializarTablero(){
	jugadores.forEach(function(jugador){
		let tr = document.createElement('tr');
		let tdJugador = document.createElement('td');
		let tdApuesta = document.createElement('td');
		let tdDinero = document.createElement('td');
		let tdCartas = document.createElement('td');
		let tdOpciones = document.createElement('td');
		let tdResultado = document.createElement('td');

		tdJugador.classList.add('jugador');
		tdApuesta.classList.add('apuesta');
		tdDinero.classList.add('dinero');
		tdCartas.classList.add('cartas');
		tdOpciones.classList.add('opciones');
		tdResultado.classList.add('resultado');

		tr.appendChild(tdJugador);
		tr.appendChild(tdApuesta);
		tr.appendChild(tdDinero);
		tr.appendChild(tdCartas);
		tr.appendChild(tdOpciones);
		tr.appendChild(tdResultado);

		tablero.appendChild(tr);

		document.querySelectorAll('.jugador').forEach(function(elem){
			elem.innerHTML = '-';
		});
		document.querySelectorAll('.apuesta').forEach(function(elem){
			elem.innerHTML = '-';
		});
		document.querySelectorAll('.dinero').forEach(function(elem){
			elem.innerHTML = '-';
		});
		document.querySelectorAll('.cartas').forEach(function(elem){
			elem.innerHTML = '-';
		});
		document.querySelectorAll('.opciones').forEach(function(elem){
			elem.innerHTML = '-';
		});
		document.querySelectorAll('.resultado').forEach(function(elem){
			elem.innerHTML = '-';
		});
	});
}

function actualizarTablero(){
	jugadores.forEach(function(jugador, index){
		const tr = tablero.childNodes[index];

		if(jugador != null){
			tr.querySelector('.jugador').innerHTML = jugador.nombre; 
			tr.querySelector('.apuesta').innerHTML = jugador.apuesta; 
			tr.querySelector('.dinero').innerHTML = jugador.dinero; 

			tdCartas = tr.querySelector('.cartas');

			// Vaciamos las cartas
			tdCartas.innerHTML = '';

			if(jugador.cartas.length != 0){
				jugador.cartas.forEach(function(carta, i){
					if(i != 0){
						tdCartas.innerHTML = tdCartas.innerHTML + ' - ';
					}

					tdCartas.innerHTML = tdCartas.innerHTML + carta.nombre;
				});
			}
			else{
				tdCartas.innerHTML = '';
			}

			tdResultado = tr.querySelector('.resultado');

			// Vaciamos los resultados
			tdResultado.innerHTML = '';
			
			if(jugador.resultadoFinal != null && jugador.puntuacion != null){
				tdResultado.innerHTML = jugador.resultadoFinal;
			} 
			else{
				tdResultado.innerHTML = '-';
			}

			tdOpciones = tr.querySelector('.opciones');

			// Vaciamos las opciones
			tdOpciones.innerHTML = '';

			// Cargamos las acciones correspondientes (botones)
			// Agregamos los eventos a los botones
			if(jugador.acciones.salir){
				btnSalir = document.createElement('button');
				btnSalir.innerHTML = 'Abandonar juego';

				btnSalir.addEventListener('click', function(){
					abandonarPartida(index);
				});

				tdOpciones.appendChild(btnSalir);
			}
			if(jugador.acciones.pedirCarta){
				btnPedirCarta = document.createElement('button');
				btnPedirCarta.innerHTML = 'Carta';

				btnPedirCarta.addEventListener('click', function(){
					aplicarAccion(index, 'pedirCarta');
				});

				tdOpciones.appendChild(btnPedirCarta);
			}
			if(jugador.acciones.plantarse){
				btnPlantarse = document.createElement('button');
				btnPlantarse.innerHTML = 'Plantarse';

				btnPlantarse.addEventListener('click', function(){
					aplicarAccion(index, 'plantarse');
				});

				tdOpciones.appendChild(btnPlantarse);
			}
			if(jugador.acciones.doblar){
				btnDoblar = document.createElement('button');
				btnDoblar.innerHTML = 'Doblar';

				btnDoblar.addEventListener('click', function(){
					aplicarAccion(index, 'doblar');
				});

				tdOpciones.appendChild(btnDoblar);
			}
			if(jugador.acciones.separar){
				btnSeparar = document.createElement('button');
				btnSeparar.innerHTML = 'Separar';

				btnSeparar.addEventListener('click', function(){
					aplicarAccion(index, 'separar');
				});

				tdOpciones.appendChild(btnSeparar);
			}
		}
		else{
			tr.querySelector('.jugador').innerHTML = '-'; 
			tr.querySelector('.apuesta').innerHTML = '-'; 
			tr.querySelector('.dinero').innerHTML = '-';
			tr.querySelector('.cartas').innerHTML = '-';
			tr.querySelector('.opciones').innerHTML = '-';
			tr.querySelector('.resultado').innerHTML = '-';
		}
	});

	let tdCroupier = tableroCroupier.querySelector('td');

	// Vaciamos el tablero del croupier
	tdCroupier.innerHTML = '';

	if(croupier.cartas.length != 0){
		croupier.cartas.forEach(function(carta, i){
			if(i != 0){
				tdCroupier.innerHTML = tdCroupier.innerHTML + ' - ';
			}

			tdCroupier.innerHTML = tdCroupier.innerHTML + carta.nombre;
		});
	}
	else{
		tdCroupier.innerHTML = '';
	}
}

function reiniciar(){
	devolverCartas();
	mezclarCartas();

	jugadores.forEach(function(jugador){
		if(jugador != null){
			jugador.resultadoFinal = '';
		}
	});

	actualizarTablero();
}

function devolverCartas(){
	jugadores.forEach(function(jugador){
		if(jugador !== null){
			if(jugador.cartas.length != 0){
				jugador.cartas.forEach(function(carta){
					cartas.push(carta);
				});

				jugador.cartas = [];
			}
		}
	});

	if(croupier.cartas.length != 0){
		croupier.cartas.forEach(function(carta){
			cartas.push(carta);
		});

		croupier.cartas = [];
	}
}

function habilitarBotones(){
	// Habilitamos algunos botones
	botonNuevaPartida.disabled = false;

	// Si hay posiciones libres, habilitamos el botón de agregar nuevo jugador
	function obtenerPrimeraPosicionLibre(jugador){
		return jugador == null;
	}

	if(jugadores.findIndex(obtenerPrimeraPosicionLibre) != -1){
			botonNuevoJugador.disabled = false;
	}

	jugadores.forEach(function(jugador){
		if(jugador != null){
			jugador.acciones.salir = true;
		}
	});

	document.querySelector('#modal .close').style.display = 'block';
}

function deshabilitarBotones(){
	// Deshabilitamos algunos botones
	botonNuevoJugador.disabled = true;
	botonNuevaPartida.disabled = true;

	jugadores.forEach(function(jugador){
		if(jugador != null){
			jugador.acciones.salir = false;
		}
	});

	document.querySelector('#modal .close').style.display = 'none';
}