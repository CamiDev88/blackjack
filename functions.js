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
						analizarJugada('jugador', index);
					}
				});
				
				// Comienza el juego
				jugar('jugador', 0);
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

function analizarJugada(mano, indexJugador){
	let jugador = null;

	switch(mano){
		case 'jugador':
			jugador = jugadores[indexJugador];
		break;

		case 'clon':
			jugador = clones[indexJugador];
		break;
	}

	if(jugador != null){
		if(jugador.cartas.length > 0){
			// Función para chequear si el croupier develó su segunda carta
			let croupierDeveloSegundaCarta = (croupier.cartas.length > 1) ? true : false;

			// Función para ver si se pasó
			function obtenerResMenorOIgualA21(resultado){
				return resultado <= 21;
			}

			// Función para ordenar números ascendentemente
			function compararNumeros(a, b)
			{
			    return a - b;
			}

			// Chequeamos si hay BlackJack
			if(chequearBlackJack(jugador.cartas)){
				// Si no se trata de una jugada con separación de cartas, es BlackJack, sino simplemente gana
				if(clones[indexJugador] != null){
					jugador.resultadoFinal = 'BlackJack';
				}
				else{
					jugador.resultadoFinal = 'Ganó';
				}

				// Si el croupier ya develó su segunda carta, chequeamos si obtuvo BlackJack, en cuyo caso hay un empate
				if(croupierDeveloSegundaCarta){
					if(chequearBlackJack(croupier.cartas)){
						// Si no se trata de una jugada con separación de cartas, es BlackJack, sino pierde
						if(clones[indexJugador] != null){
							jugador.resultadoFinal = 'Empató';
						}
						else{
							jugador.resultadoFinal = 'Perdió';
						}
					}
				}
			}
			else{
				let resultadosJugador = chequearPosiblesResultados(jugador.cartas);

				// Ordenamos los resultados del jugador, de menor a mayor y de mayor a menor	
				let minToMaxResJugador = resultadosJugador.sort(compararNumeros);		
				let maxToMinResJugador = minToMaxResJugador.reverse();

				// Chequeamos si se pasó
				let jugadorSePaso = resultadosJugador.find(obtenerResMenorOIgualA21);

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
					let resultadosCroupier = chequearPosiblesResultados(croupier.cartas);

					// Chequeamos si sacó 21
					if(resultadosJugador.indexOf(21) != -1){
						jugador.resultadoFinal = 'Ganó';

						jugador.puntuacion = 21;

						// Si el croupier ya develó su segunda carta, chequeamos si hubo empate
						if(resultadosCroupier.indexOf(21) != -1){
							jugador.resultadoFinal = 'Empató';
						}
					}
					else{
						// Si el croupier ya develó su segunda carta, analizamos si el jugador ganó, empató o perdió
						if(croupierDeveloSegundaCarta){
							// Calculamos la puntuación del jugador
							for (let i = 0; i < maxToMinResJugador.length; i++) {
								if(maxToMinResJugador[i] < 21){
									jugador.puntuacion = maxToMinResJugador[i];

									break;
								}
							}

							// Chequeamos si el croupier se pasó
							let croupierSePaso = resultadosCroupier.find(obtenerResMenorOIgualA21);

							if(croupierSePaso == undefined){
								jugador.resultadoFinal = 'Ganó';
							}
							else{
								// Chequeamos si hubo empate
								// Calculamos la puntuacion del croupier
								let maxToMinResCroupier = resultadosCroupier.sort(compararNumeros).reverse();
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

	clones.forEach(function(clon, index){
		if(clon != null){
			let jugador = jugadores[index];

			switch(clon.resultadoFinal){
				case 'Ganó':
					jugador.dinero = jugador.dinero + (clon.apuesta * 2);
				break;

				case 'Empató':
					jugador.dinero = jugador.dinero + jugador.apuesta;
				break;

				case 'Perdió':

				default:

				break;
			}

			clon.apuesta = 0;
		}
	});
}

function jugar(mano, indexJugador){
	let jugador = null;

	switch(mano){
		case 'jugador':
			jugador = jugadores[indexJugador];
		break;

		case 'clon':
			jugador = clones[indexJugador];
		break;
	}

	if(jugador !== null){
		if(jugador.apuesta != 0){
			if(jugador.resultadoFinal == 'BlackJack' || jugador.puntuacion == 21){
				concluirJugada(mano, indexJugador);
			}
			else{
				// Ponemos el timer
				ponerTimer();

				// Activamos el chequeo de tiempo
				timeCheckInterval = setInterval(function(){
					// Si se acabó el tiempo y hay más jugadores, pasamos al siguiente jugador
					// sino, analizamos la jugada
					if(chequearTiempo()){
						concluirJugada(mano, indexJugador);
					}
				}, 1000);

				habilitarAcciones(mano, indexJugador);

				actualizarTablero();
			}
		}
		else{
			concluirJugada(mano, indexJugador);
		}
	}
	else{
		concluirJugada(mano, indexJugador);
	}
}

function concluirJugada(mano, indexJugador){
	let jugador = null;

	switch(mano){
		case 'jugador':
			jugador = jugadores[indexJugador];
		break;

		case 'clon':
			jugador = clones[indexJugador];
		break;
	}

	clearInterval(timeCheckInterval);
	clearInterval(timer);

	reloj.innerHTML = '';

	// Si se trata de la última mano, finalizamos la partida
	if(mano == 'clon' && indexJugador == (jugadores.length - 1)){
		// El croupier se reparte otra carta
		croupier.cartas.push(cartas.shift());

		let callback = function(){
			jugadores.forEach(function(jugador, index){
				if(jugador != null){
					analizarJugada('jugador', index);
				}
			});

			clones.forEach(function(clon, index){
				if(clon != null){
					analizarJugada('clon', index);
				}
			});

			otorgarPremios();

			habilitarBotones();
		}

		jugarCroupier(callback);
	}
	else{
		if(mano == 'jugador'){
			// Pasamos al clon
			jugar('clon', indexJugador);
		}
		else{
			// Pasamos al jugador
			jugar('jugador', indexJugador + 1);
		}
	}

	if(jugador !== null){
		deshabilitarAcciones(mano, indexJugador);

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

function habilitarAcciones(mano, indexJugador){
	let jugador = null;

	switch(mano){
		case 'jugador':
			jugador = jugadores[indexJugador];
		break;

		case 'clon':
			jugador = clones[indexJugador];
		break;
	}

	// Acción pedir carta
	jugador.acciones.pedirCarta = true;

	// Accion plantarse
	jugador.acciones.plantarse = true;

	// Si el jugador ya dividió o si se trata de una mano clon, no podrá doblar ni separar
	if((mano == 'jugador' && clones['indexJugador'] != null) || (mano == 'clon')){
		jugador.acciones.doblar	= false;
		jugador.acciones.separar = false;
	}
	else{
		// Acción doblar
		if((jugador.apuesta * 2) <= jugador.dinero){
			jugador.acciones.doblar = true;
		}

		// Acción separar
		// Función para chequear si las cartas son equivalentes
		function chequearEquivalencia(carta1, carta2){
			for (let i = 0; i < carta1.valores.length; i++) {
				for (let j = 0; j < carta2.valores.length; j++) {
					if(carta1.valores[i] == carta2.valores[j]){
						return true;
					}
				}	
			}

			return false;		
		}

		if(jugador.cartas.length == 2 && chequearEquivalencia(jugador.cartas[0], jugador.cartas[1])){
			jugador.acciones.separar = true;
		}
	}

	// Señalar jugador en tablero
	tablero.childNodes[indexJugador].style.backgroundColor = '#061A30';
	tablero.childNodes[indexJugador].style.color = '#FFF';
}

function deshabilitarAcciones(mano, indexJugador){
	let jugador = null;

	switch(mano){
		case 'jugador':
			jugador = jugadores[indexJugador];
		break;

		case 'clon':
			jugador = clones[indexJugador];
		break;
	}

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

function aplicarAccion(mano, indexJugador, accion){
	let jugador = null;

	switch(mano){
		case 'jugador':
			jugador = jugadores[indexJugador];
		break;

		case 'clon':
			jugador = clones[indexJugador];
		break;
	}

	switch(accion){
		case 'pedirCarta':
			repartir(1, [jugador]);
			
			analizarJugada(mano, indexJugador);

			if(jugador.puntuacion == 21 || jugador.resultadoFinal == 'Se pasó'){
				concluirJugada(mano, indexJugador);
			}
		break;

		case 'plantarse':
			concluirJugada(mano, indexJugador);
		break;

		case 'doblar':
			if(jugador.apuesta <= jugador.dinero){
				jugador.dinero = jugador.dinero - jugador.apuesta;
				jugador.apuesta = jugador.apuesta * 2;

				jugador.acciones.doblar = false;
				jugador.acciones.pedirCarta = false;

				aplicarAccion(mano, indexJugador, 'pedirCarta');
			}
		break;

		case 'separar':
			generarClon(indexJugador);

			// Limpiamos el reloj
			clearInterval(timeCheckInterval);
			clearInterval(timer);

			reloj.innerHTML = '';

			jugador.acciones.separar = false;
			jugador.acciones.doblar = false;

			jugar(mano, indexJugador);
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
	/******* Jugadores *******/

	jugadores.forEach(function(jugador, index){
		let tr = tablero.childNodes[index];

		if(jugador != null){
			tr.querySelector('.jugador').innerHTML = jugador.nombre; 
			tr.querySelector('.apuesta').innerHTML = jugador.apuesta; 
			tr.querySelector('.dinero').innerHTML = jugador.dinero; 

			let tdCartas = tr.querySelector('.cartas');

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

			let tdResultado = tr.querySelector('.resultado');

			// Vaciamos los resultados
			tdResultado.innerHTML = '';
			
			if(jugador.resultadoFinal != null && jugador.puntuacion != null){
				tdResultado.innerHTML = jugador.resultadoFinal;
			} 
			else{
				tdResultado.innerHTML = '-';
			}

			let tdOpciones = tr.querySelector('.opciones');

			// Vaciamos las opciones
			tdOpciones.innerHTML = '';

			// Cargamos las acciones correspondientes (botones)
			// Agregamos los eventos a los botones
			if(jugador.acciones.salir){
				let btnSalir = document.createElement('button');
				btnSalir.innerHTML = 'Abandonar juego';

				btnSalir.addEventListener('click', function(){
					abandonarPartida(index);
				});

				tdOpciones.appendChild(btnSalir);
			}
			if(jugador.acciones.pedirCarta){
				let btnPedirCarta = document.createElement('button');
				btnPedirCarta.innerHTML = 'Carta';

				btnPedirCarta.addEventListener('click', function(){
					aplicarAccion('jugador', index, 'pedirCarta');
				});

				tdOpciones.appendChild(btnPedirCarta);
			}
			if(jugador.acciones.plantarse){
				let btnPlantarse = document.createElement('button');
				btnPlantarse.innerHTML = 'Plantarse';

				btnPlantarse.addEventListener('click', function(){
					aplicarAccion('jugador', index, 'plantarse');
				});

				tdOpciones.appendChild(btnPlantarse);
			}
			if(jugador.acciones.doblar){
				let btnDoblar = document.createElement('button');
				btnDoblar.innerHTML = 'Doblar';

				btnDoblar.addEventListener('click', function(){
					aplicarAccion('jugador', index, 'doblar');
				});

				tdOpciones.appendChild(btnDoblar);
			}
			if(jugador.acciones.separar){
				let btnSeparar = document.createElement('button');
				btnSeparar.innerHTML = 'Separar';

				btnSeparar.addEventListener('click', function(){
					aplicarAccion('jugador', index, 'separar');
				});

				tdOpciones.appendChild(btnSeparar);
			}

			// Eliminamos los divs de manos clon
			document.querySelectorAll('td div').forEach(function(div){
				div.remove();
			});
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

	/******* Manos clones ******/

	// Si hay una mano clon...
	clones.forEach(function(clon, index){
		let tr = tablero.childNodes[index];

		if(clon != null){
			let apuestaClon = document.createElement('div');
			apuestaClon.innerHTML = clon.apuesta;
			tr.querySelector('.apuesta').appendChild(apuestaClon);

			let cartasClon = document.createElement('div');

			if(clon.cartas.length != 0){
				clon.cartas.forEach(function(carta, i){
					if(i != 0){
						cartasClon.innerHTML = cartasClon.innerHTML + ' - ';
					}

					cartasClon.innerHTML = cartasClon.innerHTML + carta.nombre;
				});
			}
			else{
				cartasClon.innerHTML = '';
			}

			tr.querySelector('.cartas').appendChild(cartasClon);

			// Creamos los botones
			let botonesClon = document.createElement('div');

			if(clon.acciones.pedirCarta){
				let btnPedirCarta = document.createElement('button');
				btnPedirCarta.innerHTML = 'Carta';

				btnPedirCarta.addEventListener('click', function(){
					aplicarAccion('clon', index, 'pedirCarta');
				});

				botonesClon.appendChild(btnPedirCarta);
			}
			if(clon.acciones.plantarse){
				let btnPlantarse = document.createElement('button');
				btnPlantarse.innerHTML = 'Plantarse';

				btnPlantarse.addEventListener('click', function(){
					aplicarAccion('clon', index, 'plantarse');
				});

				botonesClon.appendChild(btnPlantarse);
			}

			tr.querySelector('.opciones').appendChild(botonesClon);

			// Volcamos el resultado, si lo hay
			let resultadoClon = document.createElement('div');
			
			if(clon.resultadoFinal != null && clon.puntuacion != null){
				resultadoClon.innerHTML = clon.resultadoFinal;
			} 
			else{
				resultadoClon.innerHTML = '-';
			}

			tr.querySelector('.resultado').appendChild(resultadoClon);
		}
	});

	/******* Croupier *******/

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

function jugarCroupier(callback){
	let resultadosCroupier = chequearPosiblesResultados(croupier.cartas);

	function obtenerResultadoMenorA17(resultado){
		return resultado < 17;
	}

	let hayResultadosMenoresA17 = resultadosCroupier.find(obtenerResultadoMenorA17);

	if(hayResultadosMenoresA17){
		croupier.cartas.push(cartas.shift());
	}

	callback();
}

function reiniciar(){
	devolverCartas();
	mezclarCartas();

	jugadores.forEach(function(jugador){
		if(jugador != null){
			jugador.resultadoFinal = '';
		}
	});

	eliminarClones();

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

function generarClon(indexJugador){
	let jugador = jugadores[indexJugador];

	clones[indexJugador] = {
				apuesta: jugador.apuesta,
				cartas: [],
				acciones: {
					pedirCarta: false,
					plantarse: false,
					doblar: false,
					separar: false,
					salir: false
				},
				puntuacion: null,
				resultadoFinal: null
			}

	clones[indexJugador].cartas = [];
	clones[indexJugador].cartas.push(jugador.cartas.pop());

	jugador.dinero = jugador.dinero - jugador.apuesta;
}

function eliminarClones(){
	clones = clones.map((clon) => { return null; });
}