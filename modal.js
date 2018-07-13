const modal = {
	elem: () => document.querySelector('#modal'),
	confirmButton: () => modal.elem().querySelector('.confirm'),
	closeButton: () => modal.elem().querySelector('.close'),
	alert: function(text){
		modal.initializeEventList();
		modal.clear();
		modal.insertText(text);

		modal.confirmButton().addEventListener('click', modal.hide, {once: true});
		modal.closeButton().addEventListener('click', modal.hide, {once: true});

		modal.closeButton().eventListenerList.push(modal.hide);
		modal.confirmButton().eventListenerList.push(modal.hide);

		modal.show();
	},
	prompt: function(text, callback){
		modal.initializeEventList();
		modal.clear();
		modal.insertText(text);

		let input = document.createElement('input');
		input.setAttribute("type", "text");

		document.querySelector('.modal-body').appendChild(input);

		modal.confirmButton().addEventListener('click', modal.hide, {once: true});
		modal.closeButton().addEventListener('click', modal.hide, {once: true});
		modal.confirmButton().addEventListener('click', callback, {once: true});
		
		modal.confirmButton().eventListenerList.push(callback);
		modal.closeButton().eventListenerList.push(modal.hide);
		modal.confirmButton().eventListenerList.push(modal.hide);

		modal.show();
	},
	insertText: function(text){
		let p = document.createElement('p');
		p.innerHTML = text;

		document.querySelector('.modal-body').appendChild(p);
	},
	show: function(){
		modal.elem().style.display = 'block';
	},
	hide: function(){
		modal.elem().style.display = 'none';
	},
	clear: function(){
		document.querySelector('.modal-body').innerHTML = '';

		// Remove attached btn click event listeners 
		modal.clearEvents();
	},
	initializeEventList: function(){
		modal.confirmButton().eventListenerList = (modal.confirmButton().eventListenerList == undefined) ? [] : modal.confirmButton().eventListenerList;
		modal.closeButton().eventListenerList = (modal.closeButton().eventListenerList == undefined) ? [] : modal.closeButton().eventListenerList;
	},
	clearEvents: function(){
		modal.confirmButton().eventListenerList.forEach((e)=>{modal.confirmButton().removeEventListener('click', e)});
		modal.closeButton().eventListenerList.forEach((e)=>{modal.closeButton().removeEventListener('click', e)});
	}
}