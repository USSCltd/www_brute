VERSION = "1.00"

var from_tabid = parseInt( location.hash.slice(1) ),
	bg = chrome.extension.getBackgroundPage(),
	current_target = bg.targets.get(from_tabid),
	wordlists = []


var actions = {
    edit_wordlist: function(wordlist_id) { edit_wordlist(wordlist_id); current_target.settings.dictionary.del_wordlist(wordlist_id); show_wordlists() },
    del_wordlist: function(wordlist_id) { current_target.settings.dictionary.del_wordlist(wordlist_id); show_wordlists() }
}

function edit_wordlist(wordlist_id)
{
	var wordlist = current_target.settings.dictionary.get_wordlist(wordlist_id)
	if(! wordlist)
		return

	document.getElementById('users').value = ''
	document.getElementById('passwords').value = ''
	document.getElementById('combo').value = ''

	for(var i = 0; i < wordlist.users.length; i++)
		document.getElementById('users').value += wordlist.users[i] + '\n'
	for(var i = 0; i < wordlist.passwords.length; i++)
		document.getElementById('passwords').value += wordlist.passwords[i] + '\n'
	for(var i = 0; i < wordlist.combo.length; i++)
		document.getElementById('combo').value += wordlist.combo[i][0] + ':' + wordlist.combo[i][1] + '\n'
}

function show_wordlists()
{
	var content = ''
	current_target.settings.dictionary.get_wordlists().forEach( function(wordlist) {
		content += '<tr>'
		content += (wordlist.users.length != 0) ? '<td><a action="edit_wordlist" wordlist_id="' + wordlist.id + '" href="#">' + wordlist.users.length + ' users </a><img src="img/delete.png" action="del_wordlist" wordlist_id="' + wordlist.id + '"></td>' : '<td></td>'
		content += (wordlist.passwords.length != 0) ? '<td><a action="edit_wordlist" wordlist_id="' + wordlist.id + '" href="#">' + wordlist.passwords.length + ' passwords </a><img src="img/delete.png" action="del_wordlist" wordlist_id="' + wordlist.id + '"></td>' : '<td></td>'
		content += (wordlist.combo.length != 0) ? '<td><a action="edit_wordlist" wordlist_id="' + wordlist.id + '" href="#">' + wordlist.combo.length + ' combo </a><img src="img/delete.png" action="del_wordlist" wordlist_id="' + wordlist.id + '"></td>' : '<td></td>'
		content += '</tr>'
	} )
	document.getElementById('wordlists').innerHTML = content

	wordlists = document.getElementsByTagName('a')
    for(var i = 0; i < wordlists.length; i++)
    {
        wordlists[i].addEventListener( 'click', (function(callback,wordlist_id) { return function() {
            callback(wordlist_id)
        } } )( actions[ wordlists[i].getAttribute('action') ], parseInt( wordlists[i].getAttribute('wordlist_id') ) ) )
    }
    wordlists = document.getElementsByTagName('img')
    for(var i = 0; i < wordlists.length; i++)
    {
        wordlists[i].addEventListener( 'click', (function(callback,wordlist_id) { return function() {
            callback(wordlist_id)
        } } )( actions[ wordlists[i].getAttribute('action') ], parseInt( wordlists[i].getAttribute('wordlist_id') ) ) )
    }
}


window.onload = function() {

	document.getElementById('ok').addEventListener( 'click', function() {
		bg.Tabs.current_tab_id = from_tabid
		window.close()
	} )

	document.getElementById('add').addEventListener( 'click', function() {
		var users = document.getElementById('users').value.split("\n"),
			passwords = document.getElementById('passwords').value.split("\n"),
			combo = document.getElementById('combo').value.split("\n"),
			wordlist = {
				combo: [ ],
				users: [ ],
				passwords: [ ]
			}
		
		for(var i = 0; i < users.length; i++)
			if( i != users.length-1 || users[i] )
				wordlist.users.push( users[i] )
		for(var i = 0; i < passwords.length; i++)
			if( i != passwords.length-1 || passwords[i] )
				wordlist.passwords.push( passwords[i] )
		for(var i = 0; i < combo.length; i++)
			if( combo[i].indexOf(':') != -1 )
				wordlist.combo.push( [ combo[i].split(':')[0], combo[i].split(':').slice(1).join(':') ] )

		if( wordlist.users.length != 0 || wordlist.passwords.length != 0 || wordlist.combo.length != 0 )
			current_target.settings.dictionary.add_wordlist(wordlist)

		show_wordlists()
		document.getElementById('users').value = ''
		document.getElementById('passwords').value = ''
		document.getElementById('combo').value = ''
	} )

	show_wordlists()
}