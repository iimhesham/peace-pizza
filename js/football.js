/* =========================================================
   PASSWORD — football name-picker (separate from the
   stories/investigation games above; no player/GM roles)
========================================================= */

/* Names are grouped by region so every deal comes from all over the world.
   easy = well-known names (مستوى عادي), hard = the deeper, less obvious ones (مستوى صعب).
   Each group may hold players and coaches. A name lives in exactly one group. */
const FOOTBALL_GROUPS=[
  {id:"egypt",label:"مصر",
   easy:["Mohamed Salah", "Mohamed Aboutrika", "Hossam Hassan", "Ibrahim Hassan", "Ahmed Hassan", "Hazem Emam", "Mido", "Essam El Hadary", "Mohamed Elneny", "Omar Marmoush", "Mahmoud Hassan Trezeguet", "Mohamed Zidan", "Shikabala", "Mohamed Nagy Gedo", "Ahmed Hegazy", "Amr Zaki", "Wael Gomaa", "Ahmed Elmohamady", "Ramadan Sobhi", "Mostafa Mohamed", "Mahmoud El Khatib", "Emad Moteab", "Hossam Ghaly", "Ahmed Sayed Zizo"],
   hard:["Hany Ramzy", "Mohamed Shawky", "Hosny Abd Rabou", "Ahmed Fathy", "Sam Morsy", "Tarek Hamed", "Mahmoud Kahraba", "Walid Soliman", "Mohamed Abdelshafy", "Rabie Yassin", "Ahmed Hassan Mekky", "Karim Hafez", "Taher Abouzeid", "Magdy Abdelghani", "Emam Ashour", "Hossam Ashour", "Mohamed Abdelmonem", "Marwan Mohsen", "Amr Warda", "Mohamed Barakat", "Abdel Zaher El-Saqqa", "Hany Said", "Ahmed Said Ouka", "Sayed Moawad"]},
  {id:"arab",label:"العرب وشمال أفريقيا",
   easy:["Hakim Ziyech", "Achraf Hakimi", "Riyad Mahrez", "Youssef En-Nesyri", "Sofyan Amrabat", "Yassine Bounou", "Rabah Madjer", "Mustapha Hadji", "Noureddine Naybet", "Mehdi Benatia", "Sami Al-Jaber", "Salem Al-Dawsari", "Omar Abdulrahman", "Younis Mahmoud", "Ismaël Bennacer", "Islam Slimani", "Youssef Msakni", "Wahbi Khazri", "Yasser Al-Qahtani", "Saeed Al-Owairan", "Noussair Mazraoui", "Ramy Bensebaini", "Akram Afif", "Almoez Ali", "Musa Al-Taamari"],
   hard:["Lakhdar Belloumi", "Badou Zaki", "Salaheddine Bassir", "Abdelmajid Dolmy", "Rachid Mekhloufi", "Tarak Dhiab", "Hatem Trabelsi", "Radhi Jaïdi", "Ali Maâloul", "Nayef Aguerd", "Azzedine Ounahi", "Mohammad Al-Deayea", "Majed Abdullah", "Ali Mabkhout", "Hussein Saeed", "Nashat Akram", "Ryad Boudebouz", "Yacine Brahimi", "Sofiane Feghouli", "Baghdad Bounedjah", "Aïssa Mandi", "Saïd Benrahma", "Karim El Ahmadi", "Marouane Chamakh", "Younès Belhanda", "Mbark Boussoufa", "Houssine Kharja", "Tarik Sektioui", "Youssef Chippo", "Adel Taarabt", "Amine Harit", "Nabil Dirar", "Rafik Saïfi", "Ali Benarbia", "Karim Ziani", "Mustapha Dahleb"]},
  {id:"africa",label:"أفريقيا",
   easy:["Didier Drogba", "Samuel Eto'o", "Sadio Mané", "Yaya Touré", "George Weah", "Jay-Jay Okocha", "Nwankwo Kanu", "Abedi Pele", "Roger Milla", "Michael Essien", "Emmanuel Adebayor", "Victor Osimhen", "Kalidou Koulibaly", "Pierre-Emerick Aubameyang", "Kolo Touré", "Wilfried Zaha", "Thomas Partey", "Edouard Mendy", "Mohammed Kudus", "Ademola Lookman", "Victor Moses", "Asamoah Gyan", "Vincent Enyeama", "John Obi Mikel"],
   hard:["Rashidi Yekini", "Taribo West", "Finidi George", "Sunday Oliseh", "Daniel Amokachi", "Stephen Keshi", "Joseph Yobo", "Obafemi Martins", "Yakubu", "Peter Odemwingie", "Celestine Babayaro", "Kwadwo Asamoah", "Stephen Appiah", "Tony Yeboah", "Samuel Kuffour", "Sulley Muntari", "Cheikh Tioté", "Didier Zokora", "Gervinho", "Salomon Kalou", "Seydou Keita", "Frédéric Kanouté", "El Hadji Diouf", "Papiss Cissé", "Rigobert Song", "Thomas N'Kono", "Benni McCarthy", "Lucas Radebe", "Steven Pienaar", "Siphiwe Tshabalala", "Kalusha Bwalya", "Bruce Grobbelaar", "Mahamadou Diarra", "Papa Bouba Diop", "Alex Song", "Idrissa Gueye"]},
  {id:"britain",label:"إنجلترا وبريطانيا وأيرلندا",
   easy:["Bobby Charlton", "Bobby Moore", "Gary Lineker", "David Beckham", "Wayne Rooney", "Steven Gerrard", "Frank Lampard", "Paul Scholes", "Ryan Giggs", "Roy Keane", "Alan Shearer", "Harry Kane", "Jude Bellingham", "Phil Foden", "Bukayo Saka", "Declan Rice", "John Terry", "Rio Ferdinand", "Michael Owen", "Gareth Bale", "George Best", "Kenny Dalglish", "Paul Gascoigne", "Raheem Sterling", "Jack Grealish"],
   hard:["Gordon Banks", "Peter Shilton", "Stanley Matthews", "Jimmy Greaves", "Kevin Keegan", "Bryan Robson", "Glenn Hoddle", "Chris Waddle", "John Barnes", "Peter Beardsley", "Ian Wright", "Teddy Sheringham", "Robbie Fowler", "Steve McManaman", "Jamie Carragher", "Ashley Cole", "Sol Campbell", "Gary Neville", "Joe Cole", "David Seaman", "Jermain Defoe", "Peter Crouch", "Gareth Barry", "James Milner", "Jordan Henderson", "Denis Law", "Billy Bremner", "Graeme Souness", "Ally McCoist", "Gordon Strachan", "Andrew Robertson", "Scott McTominay", "Ian Rush", "Mark Hughes", "Aaron Ramsey", "Neville Southall", "Pat Jennings", "Robbie Keane", "Paul McGrath", "Damien Duff", "Shay Given"]},
  {id:"spain",label:"إسبانيا",
   easy:["Xavi", "Andrés Iniesta", "Iker Casillas", "Sergio Ramos", "Gerard Piqué", "Carles Puyol", "Sergio Busquets", "David Villa", "Fernando Torres", "Raúl", "David Silva", "Cesc Fàbregas", "Jordi Alba", "Pedri", "Gavi", "Lamine Yamal", "Rodri", "Dani Carvajal", "Álvaro Morata", "Santi Cazorla", "Isco", "Juan Mata", "Dani Olmo", "Nico Williams"],
   hard:["Emilio Butragueño", "Fernando Hierro", "Andoni Zubizarreta", "Fernando Morientes", "Fernando Llorente", "Aritz Aduriz", "Gaizka Mendieta", "Rubén Baraja", "David Albelda", "Joaquín", "Jesús Navas", "José Antonio Reyes", "Pepe Reina", "Víctor Valdés", "Michel Salgado", "Míchel", "Julio Salinas", "Iván Helguera", "Carlos Marchena", "César Azpilicueta", "Marc Bartra", "Aymeric Laporte", "Mikel Oyarzabal", "Álvaro Negredo", "Thiago Alcântara", "Saúl Ñíguez", "Nacho Fernández", "Raúl Albiol", "Marcos Llorente", "Mikel Merino", "Fabián Ruiz", "Koke", "David de Gea", "José Ángel Iribar"]},
  {id:"portugal",label:"البرتغال",
   easy:["Cristiano Ronaldo", "Eusébio", "Luís Figo", "Rui Costa", "Deco", "Pepe", "Bruno Fernandes", "Bernardo Silva", "Rúben Dias", "João Cancelo", "Rafael Leão", "João Félix", "Nani", "Ricardo Quaresma", "Diogo Jota", "Vitinha", "Ricardo Carvalho", "Paulo Futre", "Simão Sabrosa", "Pauleta"],
   hard:["Mário Coluna", "José Augusto", "Fernando Chalana", "João Pinto", "Vítor Baía", "Rui Patrício", "Maniche", "Costinha", "Nuno Gomes", "Hélder Postiga", "Fábio Coentrão", "Raphaël Guerreiro", "João Moutinho", "William Carvalho", "Rúben Neves", "Nuno Mendes", "José Fonte", "Bruno Alves", "Fernando Couto", "Paulo Sousa", "Jorge Costa", "Nélson Semedo", "Gonçalo Ramos", "Éder", "Danilo Pereira", "Ricardo Pereira", "Diogo Dalot", "Otávio", "Sérgio Conceição"]},
  {id:"italy",label:"إيطاليا",
   easy:["Paolo Maldini", "Franco Baresi", "Andrea Pirlo", "Francesco Totti", "Alessandro Del Piero", "Roberto Baggio", "Gianluigi Buffon", "Fabio Cannavaro", "Paolo Rossi", "Gianluca Vialli", "Gennaro Gattuso", "Alessandro Nesta", "Christian Vieri", "Filippo Inzaghi", "Giorgio Chiellini", "Leonardo Bonucci", "Marco Verratti", "Ciro Immobile", "Lorenzo Insigne", "Federico Chiesa", "Gianluigi Donnarumma", "Nicolò Barella", "Daniele De Rossi", "Mario Balotelli"],
   hard:["Dino Zoff", "Gaetano Scirea", "Giuseppe Meazza", "Gianni Rivera", "Sandro Mazzola", "Luigi Riva", "Giacinto Facchetti", "Salvatore Schillaci", "Paolo Di Canio", "Gianfranco Zola", "Fabrizio Ravanelli", "Demetrio Albertini", "Dino Baggio", "Pierluigi Casiraghi", "Christian Panucci", "Gianluca Pagliuca", "Angelo Peruzzi", "Antonio Cassano", "Luca Toni", "Alberto Gilardino", "Antonio Di Natale", "Andrea Barzagli", "Sebastian Giovinco", "Stephan El Shaarawy", "Leonardo Spinazzola", "Alessandro Florenzi", "Gianluca Zambrotta", "Mauro Camoranesi", "Simone Perrotta", "Ciro Ferrara", "Sandro Tonali", "Gianluca Scamacca"]},
  {id:"france",label:"فرنسا",
   easy:["Zinedine Zidane", "Michel Platini", "Thierry Henry", "Kylian Mbappé", "Antoine Griezmann", "Karim Benzema", "Paul Pogba", "N'Golo Kanté", "Olivier Giroud", "Raphaël Varane", "Hugo Lloris", "Franck Ribéry", "Eric Cantona", "Patrick Vieira", "Marcel Desailly", "Lilian Thuram", "Ousmane Dembélé", "Robert Pirès", "David Trezeguet", "Nicolas Anelka", "Claude Makélélé", "Theo Hernández", "Aurélien Tchouaméni", "Eduardo Camavinga"],
   hard:["Raymond Kopa", "Just Fontaine", "Jean Tigana", "Jean-Pierre Papin", "Bixente Lizarazu", "Emmanuel Petit", "Youri Djorkaeff", "Christophe Dugarry", "Fabien Barthez", "Frank Leboeuf", "Ludovic Giuly", "Eric Abidal", "Florent Malouda", "Sylvain Wiltord", "Djibril Cissé", "Samir Nasri", "Hatem Ben Arfa", "Bacary Sagna", "Patrice Evra", "Blaise Matuidi", "Mathieu Valbuena", "Dimitri Payet", "Moussa Sissoko", "Kingsley Coman", "Benjamin Pavard", "Lucas Hernández", "Presnel Kimpembe", "Marcus Thuram", "Christopher Nkunku", "Marius Trésor", "Maxime Bossis", "Alain Giresse", "Mike Maignan", "William Saliba"]},
  {id:"germany",label:"ألمانيا والنمسا وسويسرا",
   easy:["Franz Beckenbauer", "Gerd Müller", "Lothar Matthäus", "Jürgen Klinsmann", "Miroslav Klose", "Philipp Lahm", "Bastian Schweinsteiger", "Thomas Müller", "Manuel Neuer", "Toni Kroos", "Mesut Özil", "Oliver Kahn", "Michael Ballack", "Mats Hummels", "Joshua Kimmich", "Kai Havertz", "Florian Wirtz", "Jamal Musiala", "Marco Reus", "Mario Götze", "Ilkay Gündogan", "Leroy Sané", "Antonio Rüdiger", "Karl-Heinz Rummenigge", "David Alaba"],
   hard:["Sepp Maier", "Harald Schumacher", "Uwe Seeler", "Fritz Walter", "Helmut Rahn", "Wolfgang Overath", "Paul Breitner", "Günter Netzer", "Berti Vogts", "Rudi Völler", "Andreas Brehme", "Pierre Littbarski", "Matthias Sammer", "Oliver Bierhoff", "Jürgen Kohler", "Bernd Schuster", "Thomas Hässler", "Mehmet Scholl", "Stefan Effenberg", "Jens Lehmann", "Lukas Podolski", "Per Mertesacker", "Sami Khedira", "Jérôme Boateng", "Mario Gómez", "Torsten Frings", "Lars Ricken", "Thomas Doll", "Andreas Möller", "Karl-Heinz Riedle", "Horst Hrubesch", "Marc-André ter Stegen", "Leon Goretzka", "Serge Gnabry", "Marko Arnautović", "Toni Polster", "Hans Krankl", "Xherdan Shaqiri", "Granit Xhaka", "Yann Sommer", "Alexander Frei", "Stéphane Chapuisat"]},
  {id:"lowcountries",label:"هولندا وبلجيكا",
   easy:["Johan Cruyff", "Marco van Basten", "Ruud Gullit", "Frank Rijkaard", "Dennis Bergkamp", "Ruud van Nistelrooy", "Robin van Persie", "Arjen Robben", "Wesley Sneijder", "Clarence Seedorf", "Edgar Davids", "Patrick Kluivert", "Virgil van Dijk", "Frenkie de Jong", "Matthijs de Ligt", "Memphis Depay", "Cody Gakpo", "Edwin van der Sar", "Kevin De Bruyne", "Eden Hazard", "Romelu Lukaku", "Thibaut Courtois", "Vincent Kompany", "Dries Mertens", "Jan Vertonghen"],
   hard:["Ronald Koeman", "Johan Neeskens", "Johnny Rep", "Rob Rensenbrink", "Ruud Krol", "Frank de Boer", "Ronald de Boer", "Phillip Cocu", "Marc Overmars", "Dirk Kuyt", "Rafael van der Vaart", "Klaas-Jan Huntelaar", "Ryan Babel", "Mark van Bommel", "Giovanni van Bronckhorst", "Jaap Stam", "Boudewijn Zenden", "Wim Jonk", "Pierre van Hooijdonk", "Nigel de Jong", "Georginio Wijnaldum", "Daley Blind", "Stefan de Vrij", "Nathan Aké", "Denzel Dumfries", "Xavi Simons", "Ryan Gravenberch", "Donyell Malen", "Wout Weghorst", "Steven Bergwijn", "Tim Krul", "Hans van Breukelen", "Maarten Stekelenburg", "Enzo Scifo", "Jean-Marie Pfaff", "Michel Preud'homme", "Jan Ceulemans", "Marc Wilmots", "Luc Nilis", "Franky Van der Elst", "Paul Van Himst", "Radja Nainggolan", "Toby Alderweireld", "Thomas Vermaelen", "Youri Tielemans", "Nacer Chadli", "Mousa Dembélé", "Divock Origi", "Christian Benteke", "Michy Batshuayi", "Thomas Meunier", "Simon Mignolet", "Timmy Simons", "Kevin Mirallas", "Emile Mpenza", "Charles De Ketelaere", "Amadou Onana", "Marouane Fellaini", "Axel Witsel", "Yannick Carrasco", "Jeremy Doku", "Leandro Trossard"]},
  {id:"easteurope",label:"شرق أوروبا والبلقان وتركيا",
   easy:["Andriy Shevchenko", "Hristo Stoichkov", "Dimitar Berbatov", "Davor Šuker", "Luka Modrić", "Ivan Rakitić", "Mario Mandžukić", "Robert Lewandowski", "Pavel Nedvěd", "Petr Čech", "Gheorghe Hagi", "Adrian Mutu", "Nemanja Vidić", "Dušan Vlahović", "Hakan Şükür", "Arda Turan", "Hakan Çalhanoğlu", "Arda Güler", "Lev Yashin", "Joško Gvardiol", "Zvonimir Boban", "Robert Prosinečki", "Dragan Stojković", "Ivan Perišić", "Khvicha Kvaratskhelia", "Ferenc Puskás", "Dominik Szoboszlai"],
   hard:["Oleg Blokhin", "Igor Belanov", "Rinat Dasayev", "Oleksandr Zavarov", "Serhiy Rebrov", "Anatoliy Tymoshchuk", "Yevhen Konoplyanka", "Andriy Yarmolenko", "Oleksandr Zinchenko", "Mykhailo Mudryk", "Dejan Savićević", "Predrag Mijatović", "Dejan Stanković", "Savo Milošević", "Mateja Kežman", "Sergej Milinković-Savić", "Aleksandar Mitrović", "Aleksandar Kolarov", "Luka Jović", "Siniša Mihajlović", "Vladimir Jugović", "Dragan Džajić", "Branislav Ivanović", "Dušan Tadić", "Zbigniew Boniek", "Grzegorz Lato", "Kazimierz Deyna", "Jakub Błaszczykowski", "Piotr Zieliński", "Arkadiusz Milik", "Kamil Glik", "Łukasz Piszczek", "Jerzy Dudek", "Artur Boruc", "Wojciech Szczęsny", "Jan Koller", "Tomáš Rosický", "Karel Poborský", "Vladimír Šmicer", "Milan Baroš", "Patrik Berger", "Tomáš Souček", "Josef Masopust", "Antonín Panenka", "Marek Hamšík", "Martin Škrtel", "Stanislav Lobotka", "Georgi Kinkladze", "Theodoros Zagorakis", "Georgios Karagounis", "Angelos Charisteas", "Emre Belözoğlu", "Burak Yılmaz", "Rüştü Reçber", "Tuncay Şanlı", "Nihat Kahveci", "Hamit Altıntop", "Yıldıray Baştürk", "Okan Buruk", "Tugay Kerimoğlu", "Kerem Aktürkoğlu", "Cenk Tosun", "Çağlar Söyüncü", "Merih Demiral", "Sándor Kocsis", "Flórián Albert", "Georgi Asparuhov", "Hristo Bonev", "Yordan Letchkov", "Gheorghe Popescu", "Cristian Chivu", "Dan Petrescu", "Florin Răducioiu", "Ilie Dumitrescu", "Marius Lăcătuș", "Bogdan Stelea", "Helmuth Duckadam", "Dorin Mateuț", "László Bölöni", "Alen Bokšić", "Aljoša Asanović", "Robert Jarni", "Slaven Bilić", "Dejan Lovren", "Vedran Ćorluka", "Darijo Srna", "Marcelo Brozović", "Mateo Kovačić", "Niko Kovač", "Igor Štimac", "Dario Šimić", "Ivica Olić", "Andrej Kramarić", "Henrikh Mkhitaryan"]},
  {id:"nordic",label:"شمال أوروبا",
   easy:["Zlatan Ibrahimović", "Erling Haaland", "Martin Ødegaard", "Peter Schmeichel", "Michael Laudrup", "Brian Laudrup", "Henrik Larsson", "Christian Eriksen", "Alexander Isak", "Viktor Gyökeres", "Dejan Kulusevski", "Rasmus Højlund", "Kasper Schmeichel", "Jari Litmanen", "Sami Hyypiä", "Teemu Pukki", "Victor Lindelöf", "Freddie Ljungberg", "Ole Gunnar Solskjær"],
   hard:["Jon Dahl Tomasson", "Daniel Agger", "Simon Kjær", "Nicklas Bendtner", "Thomas Gravesen", "Allan Simonsen", "Preben Elkjær", "Kim Vilfort", "Pierre-Emile Højbjerg", "Kasper Dolberg", "Tore André Flo", "Brede Hangeland", "John Arne Riise", "Morten Gamst Pedersen", "Joshua King", "Sander Berge", "Alexander Sørloth", "Tomas Brolin", "Kennet Andersson", "Thomas Ravelli", "Patrik Andersson", "Johan Elmander", "Marcus Allbäck", "Olof Mellberg", "Anders Svensson", "Sebastian Larsson", "Andreas Granqvist", "Emil Forsberg", "Gunnar Nordahl", "Nils Liedholm", "Mikael Forssell", "Lukas Hradecky", "Gylfi Sigurdsson", "Eiður Guðjohnsen", "Aron Gunnarsson"]},
  {id:"brazil",label:"البرازيل",
   easy:["Pelé", "Garrincha", "Zico", "Sócrates", "Romário", "Ronaldo Nazário", "Rivaldo", "Ronaldinho", "Kaká", "Neymar", "Cafu", "Roberto Carlos", "Dani Alves", "Marcelo", "Thiago Silva", "Marquinhos", "Casemiro", "Alisson", "Ederson", "Vinícius Júnior", "Rodrygo", "Raphinha", "Gabriel Jesus", "Richarlison", "Philippe Coutinho"],
   hard:["Didi", "Vavá", "Tostão", "Rivelino", "Jairzinho", "Careca", "Bebeto", "Dunga", "Aldair", "Lúcio", "Gilberto Silva", "Juninho Pernambucano", "Juninho Paulista", "Emerson", "Mauro Silva", "Mazinho", "Branco", "Alemão", "Edmundo", "Denílson", "Elano", "Luis Fabiano", "Fred", "Hulk", "Willian", "Oscar", "Fernandinho", "Fabinho", "Lucas Moura", "Douglas Costa", "Bruno Guimarães", "Lucas Paquetá", "Endrick", "Taffarel", "Dida", "Júlio César", "Cássio", "Rogério Ceni", "Carlos Alberto Torres", "Nilton Santos", "Djalma Santos", "Leônidas", "Zizinho", "Falcão", "Robinho", "Adriano", "Ademir", "Heleno de Freitas", "Arthur Friedenreich", "Bellini", "Moacyr Barbosa"]},
  {id:"southcone",label:"الأرجنتين وأوروغواي وتشيلي وباراغواي",
   easy:["Diego Maradona", "Lionel Messi", "Gabriel Batistuta", "Claudio Caniggia", "Javier Zanetti", "Juan Román Riquelme", "Sergio Agüero", "Carlos Tevez", "Ángel Di María", "Gonzalo Higuaín", "Lautaro Martínez", "Julián Álvarez", "Emiliano Martínez", "Enzo Fernández", "Alexis Mac Allister", "Javier Mascherano", "Paulo Dybala", "Mario Kempes", "Luis Suárez", "Edinson Cavani", "Diego Forlán", "Federico Valverde", "Alexis Sánchez", "Arturo Vidal", "Diego Godín"],
   hard:["Alfredo Di Stéfano", "Daniel Passarella", "Osvaldo Ardiles", "Ricardo Bochini", "Jorge Valdano", "Jorge Burruchaga", "Oscar Ruggeri", "Fernando Redondo", "Hernán Crespo", "Pablo Aimar", "Ariel Ortega", "Juan Sebastián Verón", "Javier Saviola", "Esteban Cambiasso", "Pablo Zabaleta", "Gabriel Heinze", "Walter Samuel", "Martín Demichelis", "Diego Milito", "Roberto Ayala", "Claudio López", "Ubaldo Fillol", "Omar Sivori", "Leopoldo Luque", "Rodrigo De Paul", "Leandro Paredes", "Nicolás Otamendi", "Lisandro Martínez", "Éver Banega", "Enzo Francescoli", "Álvaro Recoba", "Paolo Montero", "Diego Lugano", "Sebastián Abreu", "Fernando Muslera", "José María Giménez", "Ronald Araújo", "Rodrigo Bentancur", "Darwin Núñez", "Gary Medel", "Charles Aránguiz", "Claudio Bravo", "Eduardo Vargas", "Mauricio Isla", "Elías Figueroa", "Carlos Caszely", "Leonel Sánchez", "Marcelo Salas", "Iván Zamorano", "Marcelo Díaz", "David Pizarro", "Humberto Suazo", "Matías Fernández", "Jorge Valdivia", "Jean Beausejour", "José Luis Chilavert", "Roque Santa Cruz", "Carlos Gamarra", "Salvador Cabañas", "José Cardozo", "Óscar Cardozo", "Nelson Valdez", "Julio Enciso", "Miguel Almirón", "Francisco Arce", "Romerito"]},
  {id:"andes",label:"كولومبيا وبيرو والإكوادور وفنزويلا",
   easy:["James Rodríguez", "Radamel Falcao", "Carlos Valderrama", "René Higuita", "Faustino Asprilla", "Juan Cuadrado", "David Ospina", "Luis Díaz", "Yerry Mina", "Teófilo Cubillas", "Claudio Pizarro", "Paolo Guerrero", "Jefferson Farfán", "Moisés Caicedo", "Antonio Valencia", "Enner Valencia", "Carlos Bacca", "Jackson Martínez", "Mario Yepes", "Salomón Rondón"],
   hard:["Iván Córdoba", "Freddy Rincón", "Adolfo Valencia", "Arnoldo Iguarán", "Víctor Aristizábal", "Willington Ortiz", "Jorge Bermúdez", "Fredy Guarín", "Abel Aguilar", "Cristian Zapata", "Hugo Rodallega", "Juan Pablo Ángel", "Teófilo Gutiérrez", "Duván Zapata", "Juan Fernando Quintero", "Carlos Sánchez", "Jhon Durán", "Davinson Sánchez", "Héctor Chumpitaz", "Nolberto Solano", "Juan Vargas", "Hugo Sotil", "César Cueto", "Alex Aguinaga", "Iván Kaviedes", "Agustín Delgado", "Édison Méndez", "Christian Noboa", "Jefferson Montero", "Iván Hurtado", "Kendry Páez", "Marcelo Moreno Martins", "Erwin Sánchez", "Juan Arango", "Tomás Rincón", "Yangel Herrera"]},
  {id:"northam",label:"أمريكا الشمالية والوسطى",
   easy:["Christian Pulisic", "Landon Donovan", "Clint Dempsey", "Tim Howard", "Weston McKennie", "Tyler Adams", "Alphonso Davies", "Jonathan David", "Hugo Sánchez", "Cuauhtémoc Blanco", "Rafael Márquez", "Javier Hernández", "Guillermo Ochoa", "Raúl Jiménez", "Hirving Lozano", "Santiago Giménez", "Edson Álvarez", "Keylor Navas", "Andrés Guardado", "Carlos Vela", "Jorge Campos", "Giovani dos Santos"],
   hard:["Claudio Reyna", "Brian McBride", "Michael Bradley", "Jozy Altidore", "DaMarcus Beasley", "Cobi Jones", "Alexi Lalas", "Tab Ramos", "Eric Wynalda", "Brad Friedel", "Kasey Keller", "John Harkes", "DeAndre Yedlin", "Tim Weah", "Yunus Musah", "Folarin Balogun", "Ricardo Pepi", "Sergiño Dest", "Antonee Robinson", "Matt Turner", "Cyle Larin", "Atiba Hutchinson", "Junior Hoilett", "Jared Borgetti", "Luis Hernández", "Pável Pardo", "Claudio Suárez", "Carlos Salcido", "Héctor Herrera", "Jesús Corona", "Oribe Peralta", "Héctor Moreno", "Miguel Layún", "Paulo Wanchope", "Joel Campbell", "Bryan Ruiz", "Celso Borges", "Óscar Duarte", "Giancarlo González", "Walter Centeno", "Rolando Fonseca", "Carlos Pavón", "David Suazo", "Wilson Palacios", "Maynor Figueroa", "Roger Espinoza", "Dwight Yorke", "Russell Latapy", "Román Torres", "Blas Pérez"]},
  {id:"asia",label:"آسيا وأستراليا",
   easy:["Son Heung-min", "Park Ji-sung", "Shinji Kagawa", "Keisuke Honda", "Hidetoshi Nakata", "Takefusa Kubo", "Kaoru Mitoma", "Ali Daei", "Mehdi Taremi", "Sardar Azmoun", "Tim Cahill", "Harry Kewell", "Mark Viduka", "Kim Min-jae", "Lee Kang-in", "Hwang Hee-chan", "Cha Bum-kun", "Shunsuke Nakamura", "Wataru Endo", "Takehiro Tomiyasu"],
   hard:["Yasuhito Endo", "Maya Yoshida", "Makoto Hasebe", "Atsuto Uchida", "Yuto Nagatomo", "Ritsu Doan", "Ao Tanaka", "Ayase Ueda", "Junya Ito", "Daichi Kamada", "Takumi Minamino", "Kazuyoshi Miura", "Hong Myung-bo", "Ahn Jung-hwan", "Lee Dong-gook", "Ki Sung-yueng", "Lee Chung-yong", "Kim Young-gwon", "Cho Gue-sung", "Seol Ki-hyeon", "Ali Karimi", "Javad Nekounam", "Karim Bagheri", "Ashkan Dejagah", "Alireza Beiranvand", "Mile Jedinak", "Mathew Ryan", "Aaron Mooy", "Robbie Kruse", "Harry Souttar", "Mathew Leckie", "Zheng Zhi", "Wu Lei", "Sun Jihai", "Hao Haidong", "Sunil Chhetri", "Bhaichung Bhutia", "Eldor Shomurodov"]},
  {id:"coaches",label:"مدربين",
   easy:["Pep Guardiola", "José Mourinho", "Alex Ferguson", "Carlo Ancelotti", "Jürgen Klopp", "Arsène Wenger", "Diego Simeone", "Antonio Conte", "Luis Enrique", "Hansi Flick", "Mikel Arteta", "Didier Deschamps", "Fabio Capello", "Marcello Lippi", "Vicente del Bosque", "Rafael Benítez", "Thomas Tuchel", "Xabi Alonso", "Roberto Mancini", "Louis van Gaal", "Jupp Heynckes", "Unai Emery", "Massimiliano Allegri", "Hassan Shehata"],
   hard:["Rinus Michels", "Arrigo Sacchi", "Helenio Herrera", "Bob Paisley", "Brian Clough", "Bill Shankly", "Matt Busby", "Ernst Happel", "Jock Stein", "Valeriy Lobanovskyi", "Marcelo Bielsa", "Luiz Felipe Scolari", "José Pékerman", "Carlos Alberto Parreira", "Mario Zagallo", "Ottmar Hitzfeld", "Joachim Löw", "Sven-Göran Eriksson", "Guus Hiddink", "Otto Rehhagel", "Claudio Ranieri", "Roberto Martínez", "Gareth Southgate", "Ange Postecoglou", "Julian Nagelsmann", "Erik ten Hag", "Brendan Rodgers", "Walid Regragui", "Djamel Belmadi", "Héctor Cúper", "Mahmoud El Gohary", "Aliou Cissé", "Hervé Renard", "Roy Hodgson", "Sam Allardyce", "Harry Redknapp", "Tite", "Jorge Sampaoli", "Lionel Scaloni", "Nuno Espírito Santo", "Mauricio Pochettino"]}
];

/* flat list (used by the home screen counter) */
const FOOTBALL_PLAYERS=FOOTBALL_GROUPS.reduce((all,g)=>all.concat(g.easy,g.hard),[]);

const PASSWORD_CARDS=10;
const PASSWORD_SEEN_KEY="passwordSeen";

let passwordDeal=[];
let passwordFlipped=[];

function shuffledCopy(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

/* old saved values: easy/mid -> عادي, pro -> صعب */
function getPasswordLevel(){
  let v=null;
  try{v=localStorage.getItem("passwordLevel")}catch(e){}
  return v==="hard"||v==="pro"?"hard":"easy";
}

function setPasswordLevel(v){
  try{localStorage.setItem("passwordLevel",v==="hard"?"hard":"easy")}catch(e){}
  dealPasswordCards();
}

/* names already dealt (per level) so nothing repeats until a pool runs out */
function passwordLoadSeen(level){
  try{
    const all=JSON.parse(localStorage.getItem(PASSWORD_SEEN_KEY)||"{}");
    return new Set(Array.isArray(all[level])?all[level]:[]);
  }catch(e){return new Set()}
}

function passwordSaveSeen(level,set){
  try{
    const all=JSON.parse(localStorage.getItem(PASSWORD_SEEN_KEY)||"{}");
    all[level]=Array.from(set);
    localStorage.setItem(PASSWORD_SEEN_KEY,JSON.stringify(all));
  }catch(e){}
}

function dealPasswordCards(){
  const level=getPasswordLevel();
  const seen=passwordLoadSeen(level);
  const poolOf=g=>level==="hard"?g.hard:g.easy;

  /* ten different regions, one name from each */
  const regions=shuffledCopy(FOOTBALL_GROUPS.filter(g=>poolOf(g).length>0)).slice(0,PASSWORD_CARDS);

  const picked=regions.map(g=>{
    const pool=poolOf(g);
    let fresh=pool.filter(n=>!seen.has(n));
    if(fresh.length===0){          // this region is used up: start it over
      pool.forEach(n=>seen.delete(n));
      fresh=pool.slice();
    }
    const name=fresh[Math.floor(Math.random()*fresh.length)];
    seen.add(name);
    return name;
  });
  passwordSaveSeen(level,seen);

  const sel=document.getElementById("passwordLevel");
  if(sel)sel.value=level;

  passwordDeal=shuffledCopy(picked);
  passwordFlipped=new Array(passwordDeal.length).fill(false);
  renderPasswordGrid();
  toast("اتوزعوا عشرة أسامي جديدة");
}

function lockAllPasswordCards(){
  if(!passwordFlipped.some(Boolean)){
    toast("كل الكروت مقفولة بالفعل");
    return;
  }
  passwordFlipped=passwordFlipped.map(()=>false);
  renderPasswordGrid();
  toast("اتقفلت كل الكروت");
}

function togglePasswordCard(i){
  playClickSound();
  passwordFlipped[i]=!passwordFlipped[i];
  if(passwordFlipped[i])playRevealSound();
  renderPasswordGrid();
}

function renderPasswordGrid(){
  const grid=document.getElementById("passwordGrid");
  if(!grid)return;
  grid.textContent="";

  passwordDeal.forEach((name,i)=>{
    const card=document.createElement("div");
    card.className="fb-card"+(passwordFlipped[i]?" flipped":"");
    card.addEventListener("click",()=>togglePasswordCard(i));

    const inner=document.createElement("div");
    inner.className="fb-card-inner";

    const back=document.createElement("div");
    back.className="fb-card-face fb-card-back";
    const ball=document.createElement("span");
    ball.className="fb-ball";
    ball.innerHTML=`<svg viewBox="0 0 100 100" width="34" height="34" aria-hidden="true" class="fb-ball-svg">
      <circle cx="50" cy="50" r="45" fill="#f3f5f8" stroke="#c7ced8" stroke-width="3"/>
      <path d="M50 28l11 8-4 13H43l-4-13z" fill="#111827"/>
      <path d="M39 36L27 32M61 36l12-4M43 49L34 59M57 49l9 10M50 28v-9" fill="none" stroke="#111827" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M34 59l-7 9M66 59l7 9M50 62v13" fill="none" stroke="#111827" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`;
    const idx=document.createElement("span");
    idx.className="fb-index";
    idx.textContent=String(i+1);
    back.append(ball,idx);

    const front=document.createElement("div");
    front.className="fb-card-face fb-card-front";
    const nameSpan=document.createElement("span");
    nameSpan.dir="ltr";
    nameSpan.textContent=name;
    front.appendChild(nameSpan);

    inner.append(back,front);
    card.appendChild(inner);
    grid.appendChild(card);
  });
}


