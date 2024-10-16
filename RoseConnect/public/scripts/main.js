var rhit = rhit || {};

rhit.FB_COLLECTION_USERS = "RoseConnectUsers";
rhit.FB_COLLECTION_TEAMS = "RoseConnectTeams";

rhit.FB_KEY_CLASSNAME = "className";
rhit.FB_KEY_STUDENTS = "students";

rhit.FB_KEY_EMAIL = "email";
// rhit.FB_KEY_PASSWORD = "password";
rhit.FB_KEY_FNAME = "fName";
rhit.FB_KEY_LNAME = "lName";

rhit.FB_KEY_TEAM = "team";
rhit.FB_COLLECTION_CALENDAR = "RoseConnectCalendar"; // necessary to avoid collision with prev versions
rhit.FB_KEY_EVENT_NAME = "eventName";
rhit.FB_KEY_LOCATION = "location";
rhit.FB_KEY_START_TIME = "startTime";
rhit.FB_KEY_END_TIME = "endTime";

rhit.FB_KEY_MESSAGE = "message";
rhit.FB_KEY_SENDER = "sender";
rhit.FB_KEY_EDITED = "edited";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";

rhit.FB_KEY_SCHEDULE = "schedule";

rhit.fUsersManager = null; //list of movie quotes (to display all of the relevant quotes)
rhit.fbDetailPageManager = null; //single movie quote (to update quote)
rhit.fbAuthManager = null; //for authentication
rhit.fbCalendarManager = null;
rhit.fbChatManager = null;
rhit.currentTeam = null;


//the manager classes are all model object classes 

function toggleDropdown() {
	document.querySelector(".dropbtn").innerHTML = rhit.currentTeam;

}

function addNavListeners() {
	document.querySelector("#navChatButton").addEventListener("click", (event) => {
		window.location.href = "/chatteams.html";
	});
	document.querySelector("#navLinksButton").addEventListener("click", (event) => {
		window.location.href = "/links.html";
	});
	document.querySelector("#navHomeButton").addEventListener("click", (event) => {
		window.location.href = "/home.html";
	});
	document.querySelector("#navCalendarButton").addEventListener("click", (event) => {
		window.location.href = "/calendar.html";
	});
	document.querySelector("#navSettingsButton").addEventListener("click", (event) => {
		window.location.href = "/settings.html";
	});
}


function htmlToElement(html) {
	var template = document.createElement("template");
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
		console.log("you have made the auth manager");
	}
	beginListening(changeListener) {

		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});

	}
	signIn() {
		// Please note this needs to be the result of a user interaction
		// (like a button click) otherwise it will get blocked as a popup
		Rosefire.signIn("2b76fdd4-d784-4aef-8d03-b0ce4b7608b4", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);


			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token') {
					alert('The token you provided is not valid.');
				}
				else {
					console.log("Custom auth error", errorCode, errorMessage);
				}
			});

			// TODO: Use the rfUser.token with your server.
		});

	}
	signOut() {

		firebase.auth().signOut().catch((error) => {
			// An error happened.
			console.log("sign out error");
		});
	}
	get isSignedIn() {
		return this._user != null;
	}
	get uid() {
		return this._user.uid;
	}
	get user() {
		return this._user;
	}


}

rhit.FUsersManager = class {
	constructor() {
		//this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS);
		this._refTeams = firebase.firestore().collection(rhit.FB_COLLECTION_TEAMS);
		this._unsubscribe = null;
		this._newOrNot = false;
	}



	// Just gets rid of firebase stuff
	async clearSchedule() {
		await this._ref.doc(rhit.fbAuthManager.uid).update({
			[rhit.FB_KEY_SCHEDULE]: [],
		});
	}

	async saveSchedule() {
		await this._ref.doc(rhit.fbAuthManager.uid).update({
			[rhit.FB_KEY_SCHEDULE]: JSON.parse(window.sessionStorage.getItem("words")),
		});
	}

	async getSchedule() {
		const snapshot = await this._ref.doc(rhit.fbAuthManager.uid).get();
		return snapshot.get(rhit.FB_KEY_SCHEDULE);
	}

	async getPertinentTeams() {
		const snapshot = await this._refTeams.get();
		let allTeams = snapshot.docs.map(doc => doc.data());
		let allIds = snapshot.docs.map(doc => doc.id);
		let pertinentTeams = [];
		for (let i = 0; i < allTeams.length; i++) {
			if (allTeams[i]['students'].includes(rhit.fbAuthManager.uid)) {
				pertinentTeams.push(allIds[i]);
			}
		}
		return pertinentTeams;
	}


	addUserToTeams(firstClass, secondClass, thirdClass, fourthClass) {
		// Don't forget to rhit.fUsersManager even inside the class, this ain't Java

		let promiseList = [];

		// TODO DO FORMATTING CHECKING ON CLASSES BEFORE CALLING THIS METHOD
		if (firstClass) {
			promiseList.push(rhit.fUsersManager.addTeam(firstClass));
		}
		if (secondClass) {
			promiseList.push(rhit.fUsersManager.addTeam(secondClass));
		}
		if (thirdClass) {
			promiseList.push(rhit.fUsersManager.addTeam(thirdClass));
		}
		if (fourthClass) {
			promiseList.push(rhit.fUsersManager.addTeam(fourthClass));
		}
		return Promise.all(promiseList);
	}

	async addTeam(classString) {
		// TODO Make teamstring the name of the team they should join, based on async looping to check for current availability
		let teamster = rhit.fUsersManager.getTeamString(classString);
		await teamster.then(
			(value) => {
				let teamString = value[0];
				const teamExists = value[1]; // based on whether teamstring was null

				if (!teamExists && !teamString) {
					teamString = classString + "-1";
				}
				let studentster = rhit.fUsersManager.getStudents(teamString, teamExists);
				studentster.then(
					(studen) => {
						// studen SHOULD be null if the team doesn't exist

                        let studentsArr = [rhit.fbAuthManager.uid]; // TODO Make this gotten from the document and then push on our students name
                        // If we have a nonNull teamString (aka the team is there), then we should be able to get the previous members and add on
                        if (studen) {
                            studentsArr = studen;
                            studentsArr.push(rhit.fbAuthManager.uid);
                        }
                        console.log("studentsArr: " + studentsArr);

                        if (this._refTeams.doc(teamString)) {
                            console.log("SHOULD BE ADDING");
                            this._refTeams.doc(teamString).set({
                                [rhit.FB_KEY_CLASSNAME]: classString,
                                [rhit.FB_KEY_STUDENTS]: studentsArr,
                            })
                                .catch((error) => {
                                    console.error("Error adding document: ", error);
                                });
                            return;
                        }
                        else {
                            return;
                        }
						
					}
				).catch((error) => {
					console.error("Error adding document: ", error);
				});

			}
		).catch((error) => {
			console.error("Error adding document: ", error);
		});



	}

	// TODO ALWAYS CALL ADDUSER AFTER ADDTEAM; IT USUALLY REDIRECTS BEFORE ALL UPDATES CAN BE MADE
	addUser(fName, lName) {


		if (this._ref.doc(rhit.fbAuthManager.uid)) {
			return this._ref.doc(rhit.fbAuthManager.uid).set({
				[rhit.FB_KEY_EMAIL]: `${rhit.fbAuthManager.uid}@rose-hulman.edu`,
				[rhit.FB_KEY_SCHEDULE]: JSON.parse(window.sessionStorage.getItem("words")),
				[rhit.FB_KEY_FNAME]: fName,
				[rhit.FB_KEY_LNAME]: lName,
			});
		}
		else {
			console.log("No user added; no one logged in");
			return;
		}

	}
	async deleteUserFromTeam(teamString) {		
		let curStuds = await rhit.fUsersManager.getStudents(teamString, true);
		console.log("tryna dlete from: "+curStuds);
		let newArr = [];
		for (let i = 0; i < curStuds.length; i++) {
			if (curStuds[i] != rhit.fbAuthManager.uid) {
				newArr.push(curStuds[i]);
			}
		}
		console.log("post dlete: "+newArr);
		return this._refTeams.doc(teamString).update({
			[rhit.FB_KEY_STUDENTS]: newArr,
		});
	}
	
	get newOrNot() {
		return this._newOrNot;
	}

	async getStudents(teamString, teamExists) {
		let studs = null;
		console.log('teamString in getStudents:>> ', teamString);
		if (teamExists) {
			await this._refTeams.doc(teamString).get().then((doc) => {
				console.log("Students: " + doc.data().students);
				studs = doc.data().students;
			});
		}
		
		return studs;
	}

	async getTeamString(classString) {
		const teams = [];

		let query = this._refTeams;

		await query.get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				teams.push(doc.id);
			});
		});

		let latestTeam = 0;

		for (let i = 0; i < teams.length; i++) {
			let curClass = teams[i].slice(0, teams[i].indexOf('-'));
			let sts = await rhit.fUsersManager.getStudents(teams[i],true);
			console.log('sts :>> ', sts);
			if (curClass == classString) { // we found a potential team
				if(parseInt(teams[i].substring(teams[i].lastIndexOf('-')+1))>latestTeam){
					latestTeam = parseInt(teams[i].substring(teams[i].lastIndexOf('-')+1));
				}
				if (sts.length<3) {
				return [teams[i],true];
				}
			}
		}
		let newTeam = null;
		if (latestTeam>0) {
			newTeam = classString+"-"+(latestTeam+1).toString();
		}
		return [newTeam,false];
	}

	async isNewUser() {

		const docks = [];

		let query = this._ref;

		await query.get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				docks.push(doc.id);
			});
		});

		for (let i = 0; i < docks.length; i++) {
			console.log("docks[i]" + docks[i]);
			if (docks[i] == rhit.fbAuthManager.uid) {
				return false;
			}
		}
		return true;
	}



	beginListening() {
		console.log('this._ref :>> ', this._ref);

		let query = this._ref;
		// if (this._uid) {
		// 	//this allows you to just change the url directly; 
		// 	//you could do this with the current user but then you can't really use the url parameters
		// 	query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		// }
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;

			// querySnapshot.forEach((doc) => {
			// 	console.log(doc.data());
			// });
			//console.log("Current cities in CA: ", cities.join(", "));
			// changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	// update(id, quote, movie){

	// }
	// delete(id){

	// }
	get length() {
		return this._documentSnapshots.length;
	}

	get snapshots() {
		return this._documentSnapshots[i].id;
	}
	
	
}

rhit.SignUpController = class {
	constructor() {
		document.querySelector("#submitSignupButton").onclick = (event) => {
			const fName = document.querySelector("#firstName").value;
			const lName = document.querySelector("#lastName").value;
			const firstClass = document.querySelector("#firstClass").value;
			const secondClass = document.querySelector("#secondClass").value;
			const thirdClass = document.querySelector("#thirdClass").value;
			const fourthClass = document.querySelector("#fourthClass").value;
			let addTeamsPromise = rhit.fUsersManager.addUserToTeams(firstClass, secondClass, thirdClass, fourthClass);

			// TODO ALWAYS CALL ADDUSER AFTER ADDTEAM; IT USUALLY REDIRECTS BEFORE ALL UPDATES CAN BE MADE
			let addUserPromise = rhit.fUsersManager.addUser(fName, lName);
			
			Promise.all([addTeamsPromise, addUserPromise]).then(() => {
				window.sessionStorage.clear(); // clears schedule
				window.location.href = "/home.html"; //UNCOMMENT
			});
		}
	}
}

rhit.CalendarController = class {
	constructor(pertinentTeams) {
		this._pertinentTeams = pertinentTeams;
		const teamsList = htmlToElement('<div id="myDropdown" class="dropdown-content"></div>');
		for (let b = 0; b < this._pertinentTeams.length; b++) {
			const newTeamLink = htmlToElement('<a href="#">' + this._pertinentTeams[b] + '</a>');
			newTeamLink.onclick = (event) => {
				rhit.currentTeam = this._pertinentTeams[b];
				console.log(this._pertinentTeams[b]);
				toggleDropdown();
			}
			teamsList.appendChild(newTeamLink);
		}

		// toggleDropdown();


		const oldList = document.querySelector("#myDropdown");
		console.log('oldList :>> ', oldList);
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(teamsList);

		document.querySelector("#submitAddEvent").onclick = (event) => {
			const eName = document.querySelector("#eventName").value;
			const loc = document.querySelector("#inputLocation").value;
			const fDate = document.querySelector("#fromDate").value;
			const tDate = document.querySelector("#toDate").value;
			// const temp = new Date(fDate);
			const curTeam = rhit.currentTeam; // TODO: GET THIS FROM A DROPDOWN; DEFAULT WILL BE DROPDOWN[0] OR WHATEVER
			document.querySelector("#eventName").value = "";
			document.querySelector("#inputLocation").value = "";
			document.querySelector("#fromDate").value = "";
			document.querySelector("#toDate").value = "";
			
			rhit.fbCalendarManager.add(eName, loc, fDate, tDate, curTeam);
		}

		rhit.fbCalendarManager.beginListening(this.updateList.bind(this));
	}


	_createCard(calendar) {
		const days = ["Sun", "Mon", "Tue", 'Wed', 'Thu', 'Fri', 'Sat'];
		const temp = new Date(calendar.fDate);
		console.log('calendar.fDate.toDate().toString().substring(8,10) :>> ', calendar.fDate.toDate().toString().substring(16, 21));
		const rawStartHr = calendar.fDate.toDate().toString().substring(16, 18);
		const rawStartMin = calendar.fDate.toDate().toString().substring(19, 21);
		const rawEndHr = calendar.tDate.toDate().toString().substring(16, 18);
		const rawEndMin = calendar.tDate.toDate().toString().substring(19, 21);
		const team = calendar.team;
		console.log('rawStartHr :>> ', rawStartHr);
		console.log('rawStartMin :>> ', rawStartMin);
		console.log('rawEndHr :>> ', rawEndHr);
		console.log('rawEndMin :>> ', rawEndMin);
		let oStartString = "";
		let oEndString = "";
		if (Number(rawStartHr) > 12) {
			oStartString = Number(rawStartHr) - 12 + ":" + rawStartMin + " PM";
		}
		else {
			oStartString = (rawStartHr) + ":" + rawStartMin + " AM";
		}
		console.log('oStartString :>> ', oStartString);
		if (Number(rawEndHr) > 12) {
			oEndString = Number(rawEndHr) - 12 + ":" + rawEndMin + " PM";
		}
		else {
			oEndString = (rawEndHr) + ":" + rawEndMin + " AM";
		}
		let outputString = "";
		let outputWeekdayString = "";

		if(calendar.tDate.toDate().toString().substring(4, 7) === calendar.fDate.toDate().toString().substring(4, 7) && calendar.fDate.toDate().toString().substring(8, 10) === calendar.tDate.toDate().toString().substring(8, 10)){
			// console.log('calendar.fDate.toDate().toString().substring(4, 7) :>> ', calendar.fDate.toDate().toString().substring(4, 7));
			outputString = `${calendar.fDate.toDate().toString().substring(4, 7)} ${calendar.fDate.toDate().toString().substring(8, 10)}`;
			outputWeekdayString = `${calendar.fDate.toDate().toString().substring(0, 4)}`;
		}
		else if(calendar.tDate.toDate().toString().substring(4, 7) === calendar.fDate.toDate().toString().substring(4, 7) && calendar.fDate.toDate().toString().substring(8, 10) !== calendar.tDate.toDate().toString().substring(8, 10)){
			// console.log('calendar.fDate.toDate().toString().substring(8, 10) :>> ', calendar.fDate.toDate().toString().substring(8, 10));
			outputString = `${calendar.fDate.toDate().toString().substring(4, 7)} ${calendar.fDate.toDate().toString().substring(8, 10)} - ${calendar.tDate.toDate().toString().substring(8, 10)}`;
			outputWeekdayString = `${calendar.fDate.toDate().toString().substring(0, 4)} - ${calendar.tDate.toDate().toString().substring(0, 4)}`;
		}
		else{
			outputString = `${calendar.fDate.toDate().toString().substring(4, 7)} ${calendar.fDate.toDate().toString().substring(8, 10)} - ${calendar.tDate.toDate().toString().substring(4, 7)} ${calendar.tDate.toDate().toString().substring(8, 10)}`;
			outputWeekdayString = `${calendar.fDate.toDate().toString().substring(0, 4)} - ${calendar.tDate.toDate().toString().substring(0, 4)}`;
		}

		
		return htmlToElement(`
		<div class="row pad">
		<div id="dayWeek" class="card col-6">
		  <div class="card-body">
			<h5 id="monthNum" class="card-title">${outputString}</h5>
			<h7 id="weekday" class="card-subtitle mb-2">${outputWeekdayString}</h7>
		  </div>
		</div>
		<div id="eventDetail" class="card col-7">
		  <div class="card-body">
			<h5 id="name" class="card-title">${calendar.eName}</h5>
			<h6 id="time" class="card-subtitle mb-2 text-muted">${oStartString} - ${oEndString} EST</h6>
			<h6 id="loc" class="card-subtitle mb-2 text-muted">Location: ${calendar.loc}</h6>
			<h6 id="team" class="card-subtitle mb-2 text-muted">${team}</h6>
		  </div>
		</div>
		
		`)
	}

	updateList() {
		console.log(`num quotes = ${rhit.fbCalendarManager.length}`);

		//Make a new quoteListContainer
		const newList = htmlToElement('<div id="mainCalendarPage"></div>');
		//Fill the quoteListContainer with quote cards using a loop
		for (let i = 0; i < rhit.fbCalendarManager.length; i++) {
			const mq = rhit.fbCalendarManager.getCalendarAtIndex(i);
			console.log('mq :>> ', mq);
			console.log('mq.team :>> ', mq.team);
			console.log('mq.fDate :>> ', mq.fDate.toDate().toString().substring(1, 10));
			console.log('mq.toDate()<firebase.firestore.Timestamp.now() :>> ', mq.fDate.toDate()<firebase.firestore.Timestamp.now());
			const newCard = this._createCard(mq);
			newCard.onclick = (event) => {
				console.log(`you clicked on ${mq.id}`);
				window.location.href = `/calendarDetail.html?id=${mq.id}`; //TODO GO HERE FOR Path Update
			}
			newList.appendChild(newCard);
		}
		//Remove the quoteListContainer
		const oldList = document.querySelector("#mainCalendarPage");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		//Put in the new quoteListContainer
		oldList.parentElement.appendChild(newList);
	}
}

rhit.FbCalendarManager = class {
	constructor(pertinentTeams) {
		this._pertinentTeams = pertinentTeams;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_CALENDAR);
		this._unsubscribe = null;
	}
	add(eName, loc, fDate, tDate, team) {
		// Add a new document with a generated id.
		this._ref.add({
			[rhit.FB_KEY_EVENT_NAME]: eName,
			[rhit.FB_KEY_LOCATION]: loc,
			[rhit.FB_KEY_START_TIME]: firebase.firestore.Timestamp.fromDate(new Date(fDate)),
			[rhit.FB_KEY_END_TIME]: firebase.firestore.Timestamp.fromDate(new Date(tDate)),
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
			[rhit.FB_KEY_TEAM]: team,
		})
			.then((docRef) => {
				console.log("Calendar document written with ID: ", docRef.id);
			})
			.catch((error) => {
				console.error("Error adding document: ", error);
			});
	}
	beginListening(changeListener) {
		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50);

		// value is a array of the strings of the team ids
		query = query.where(rhit.FB_KEY_TEAM, 'in', this._pertinentTeams);
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}

	get length() {
		return this._documentSnapshots.length;
	}


	getCalendarAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		console.log("lENGTH: " + this._documentSnapshots.length);
		console.log('inside get calendar at index docSnapshot.id :>> ', docSnapshot.id);

		const mq = new rhit.Calendar(
			docSnapshot.get(rhit.FB_KEY_TEAM),
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_EVENT_NAME),
			docSnapshot.get(rhit.FB_KEY_LOCATION),
			docSnapshot.get(rhit.FB_KEY_START_TIME),
			docSnapshot.get(rhit.FB_KEY_END_TIME)
		);
		return mq;
	}
}

rhit.Calendar = class {
	constructor(team, id, eName, loc, fDate, tDate) {
		this.team = team;
		this.id = id;
		this.eName = eName;
		this.loc = loc;
		this.fDate = fDate;
		this.tDate = tDate;
	}
}

rhit.DetailPageController = class {
	constructor() {
		document.querySelector("#submitEditQuote").onclick = (event) => {
			// console.log("inside");
			const eName = document.querySelector("#eventName").value;
			const loc = document.querySelector("#inputLocation").value;
			const fDate = document.querySelector("#fromDate").value;
			const tDate = document.querySelector("#toDate").value;
			console.log('loc :>> ', loc);
			const temp = new Date(fDate);
			rhit.fbDetailPageManager.update(eName, loc, fDate, tDate);
		}

		$('#editQuoteDialog').on('show.bs.modal', (event) => {
			// pre animation
			const rawStartHr = rhit.fbDetailPageManager.fDate.toDate().toString().substring(16, 18);
			const rawStartMin = rhit.fbDetailPageManager.fDate.toDate().toString().substring(19, 21);
			const rawEndHr = rhit.fbDetailPageManager.tDate.toDate().toString().substring(16, 18);
			const rawEndMin = rhit.fbDetailPageManager.tDate.toDate().toString().substring(19, 21);
			// console.log('rawStartHr :>> ', rawStartHr);
			// console.log('rawStartMin :>> ', rawStartMin);
			// console.log('rawEndHr :>> ', rawEndHr);
			// console.log('rawEndMin :>> ', rawEndMin);
			let oStartString = "";
			let oEndString = "";
			if (Number(rawStartHr) > 12) {
				oStartString = Number(rawStartHr) - 12 + ":" + rawStartMin + " PM";
			}
			else {
				oStartString = (rawStartHr) + ":" + rawStartMin + " AM";
			}
			// console.log('oStartString :>> ', oStartString);
			if (Number(rawEndHr) > 12) {
				oEndString = Number(rawEndHr) - 12 + ":" + rawEndMin + " PM";
			}
			else {
				oEndString = (rawEndHr) + ":" + rawEndMin + " AM";
			}
			// change time to this: e specified value "Mon " does not conform to the required format.  The format is "yyyy-MM-ddThh:mm" followed by optional ":ss" or ":ss.SSS".
			// console.log('rhit.fbDetailPageManager.fDate.toDate() :>> ', rhit.fbDetailPageManager.fDate.toDate());
			const monthMap = { "0": "01", "1": "02", "2": "03", "3": "04", "4": "05", "5": "06", "6": "07", "7": "08", "8": "09", "9": "10", "10": "11", "11": "12" }
			// console.log('rhit.fbDetailPageManager.fDate.toDate().toString().substring(11, 15) :>> ', rhit.fbDetailPageManager.fDate.toDate().toString().substring(11, 15));
			// console.log('monthMap[rhit.fbDetailPageManager.fDate.toDate().getMonth()] :>> ', monthMap[rhit.fbDetailPageManager.fDate.toDate().getMonth()]);
			// console.log('rhit.fbDetailPageManager.fDate.toDate().getUTCDate() :>> ', rhit.fbDetailPageManager.fDate.toDate().getUTCDate());
			// console.log(".padStart(2, '0')); :>> ", "2".padStart(2, '0'));
			document.querySelector("#eventName").value = rhit.fbDetailPageManager.eName;
			document.querySelector("#inputLocation").value = rhit.fbDetailPageManager.loc;
			document.querySelector("#fromDate").value = `${rhit.fbDetailPageManager.fDate.toDate().toString().substring(11, 15)}-${monthMap[(rhit.fbDetailPageManager.fDate.toDate().getMonth())]}-${rhit.fbDetailPageManager.fDate.toDate().getUTCDate().toString().padStart(2, '0')}T${rawStartHr}:${rawStartMin}`;
			document.querySelector("#toDate").value = `${rhit.fbDetailPageManager.tDate.toDate().toString().substring(11, 15)}-${monthMap[(rhit.fbDetailPageManager.tDate.toDate().getMonth())]}-${rhit.fbDetailPageManager.tDate.toDate().getUTCDate().toString().padStart(2, '0')}T${rawEndHr}:${rawEndMin}`;
		})

		$('#editQuoteDialog').on('shown.bs.modal', (event) => {
			// post animation
			document.querySelector("#name").focus();
		})

		document.querySelector("#submitDeleteQuote").onclick = (event) => {
			rhit.fbDetailPageManager.delete().then(() => {
				console.log("Document successfully deleted!");
				window.location.href = "/calendar.html";
			}).catch((error) => {
				console.error("Error removing document: ", error);
			});
		}

		rhit.fbDetailPageManager.beginListening(this.updateView.bind(this));
	}

	updateView() {
		console.log('rhit.fbDetailPageManager.loc :>> ', rhit.fbDetailPageManager.loc);
		// <h5 class="card-title">${calendar.fDate.toDate().toString().substring(4,7)}, ${calendar.fDate.toDate().toString().substring(8,10)}</h5>
		const rawStartHr = rhit.fbDetailPageManager.fDate.toDate().toString().substring(16, 18);
		const rawStartMin = rhit.fbDetailPageManager.fDate.toDate().toString().substring(19, 21);
		const rawEndHr = rhit.fbDetailPageManager.tDate.toDate().toString().substring(16, 18);
		const rawEndMin = rhit.fbDetailPageManager.tDate.toDate().toString().substring(19, 21);
		console.log('rawStartHr :>> ', rawStartHr);
		console.log('rawStartMin :>> ', rawStartMin);
		console.log('rawEndHr :>> ', rawEndHr);
		console.log('rawEndMin :>> ', rawEndMin);
		let oStartString = "";
		let oEndString = "";
		if (Number(rawStartHr) > 12) {
			oStartString = Number(rawStartHr) - 12 + ":" + rawStartMin + " PM";
		}
		else {
			oStartString = (rawStartHr) + ":" + rawStartMin + " AM";
		}
		console.log('oStartString :>> ', oStartString);
		if (Number(rawEndHr) > 12) {
			oEndString = Number(rawEndHr) - 12 + ":" + rawEndMin + " PM";
		}
		else {
			oEndString = (rawEndHr) + ":" + rawEndMin + " AM";
		}


		let outputString = "";
		let outputWeekdayString = "";

		if(rhit.fbDetailPageManager.tDate.toDate().toString().substring(4, 7) === rhit.fbDetailPageManager.fDate.toDate().toString().substring(4, 7) && rhit.fbDetailPageManager.fDate.toDate().toString().substring(8, 10) === rhit.fbDetailPageManager.tDate.toDate().toString().substring(8, 10)){
			// console.log('calendar.fDate.toDate().toString().substring(4, 7) :>> ', calendar.fDate.toDate().toString().substring(4, 7));
			outputString = `${rhit.fbDetailPageManager.fDate.toDate().toString().substring(4, 7)} ${rhit.fbDetailPageManager.fDate.toDate().toString().substring(8, 10)}`;
			outputWeekdayString = `${rhit.fbDetailPageManager.fDate.toDate().toString().substring(0, 4)}`;
		}
		else if(rhit.fbDetailPageManager.tDate.toDate().toString().substring(4, 7) === rhit.fbDetailPageManager.fDate.toDate().toString().substring(4, 7) && rhit.fbDetailPageManager.fDate.toDate().toString().substring(8, 10) !== rhit.fbDetailPageManager.tDate.toDate().toString().substring(8, 10)){
			// console.log('calendar.fDate.toDate().toString().substring(8, 10) :>> ', calendar.fDate.toDate().toString().substring(8, 10));
			outputString = `${rhit.fbDetailPageManager.fDate.toDate().toString().substring(4, 7)} ${rhit.fbDetailPageManager.fDate.toDate().toString().substring(8, 10)} - ${rhit.fbDetailPageManager.tDate.toDate().toString().substring(8, 10)}`;
			outputWeekdayString = `${rhit.fbDetailPageManager.fDate.toDate().toString().substring(0, 4)} - ${rhit.fbDetailPageManager.tDate.toDate().toString().substring(0, 4)}`;
		}
		else{
			outputString = `${rhit.fbDetailPageManager.fDate.toDate().toString().substring(4, 7)} ${rhit.fbDetailPageManager.fDate.toDate().toString().substring(8, 10)} - ${rhit.fbDetailPageManager.tDate.toDate().toString().substring(4, 7)} ${rhit.fbDetailPageManager.tDate.toDate().toString().substring(8, 10)}`;
			outputWeekdayString = `${rhit.fbDetailPageManager.fDate.toDate().toString().substring(0, 4)} - ${rhit.fbDetailPageManager.tDate.toDate().toString().substring(0, 4)}`;
		}


		document.querySelector("#name").innerHTML = rhit.fbDetailPageManager.eName;
		document.querySelector("#time").innerHTML = `<h6 id="time" class="card-subtitle mb-2 text-muted">${oStartString} - ${oEndString} EST</h6>`;
		document.querySelector("#monthNum").innerHTML = `<h5 id="monthNum" class="card-title">${outputString}</h5>`;
		document.querySelector("#weekday").innerHTML = `<h7 id="weekday" class="card-subtitle mb-2">${outputWeekdayString}</h7>`;
		document.querySelector("#team").innerHTML = `<h7 id="team" class="card-subtitle mb-2">${rhit.fbDetailPageManager.team}</h7>`;
		document.querySelector("#loc").innerHTML = `<h6 id="loc" class="card-subtitle mb-2 text-muted">${rhit.fbDetailPageManager.loc}</h6>`;
	}


}

rhit.FbDetailPageManager = class {
	constructor(movieQuoteId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_CALENDAR).doc(movieQuoteId);
		console.log(`Listening to ${this._ref.path}`);
	}
	beginListening(changeListener) {

		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
			}
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	update(eName, loc, fDate, tDate) {
		this._ref.update({
			[rhit.FB_KEY_EVENT_NAME]: eName,
			[rhit.FB_KEY_LOCATION]: loc,
			[rhit.FB_KEY_START_TIME]: firebase.firestore.Timestamp.fromDate(new Date(fDate)),
			[rhit.FB_KEY_END_TIME]: firebase.firestore.Timestamp.fromDate(new Date(tDate)),
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
		})
			.then((docRef) => {
				console.log("Document written with ID: ", docRef.id);
			})
			.catch((error) => {
				console.error("Error adding document: ", error);
			});
	}
	delete() {
		return this._ref.delete();
	}

	get eName() {
		return this._documentSnapshot.get(rhit.FB_KEY_EVENT_NAME);
	}

	get loc() {
		return this._documentSnapshot.get(rhit.FB_KEY_LOCATION);
	}

	get fDate() {
		return this._documentSnapshot.get(rhit.FB_KEY_START_TIME);
	}

	get tDate() {
		return this._documentSnapshot.get(rhit.FB_KEY_END_TIME);
	}

	get team() {
		return this._documentSnapshot.get(rhit.FB_KEY_TEAM);
	}
}

rhit.checkForRedirects = function () {
	// console.log("inside");
	// console.log('document.querySelector("#mainPage") :>> ', document.querySelector("#mainPage"));
	// console.log('rhit.fbAuthManager.isSignedIn :>> ', rhit.fbAuthManager.isSignedIn);



	if (document.querySelector("#mainPage") && rhit.fbAuthManager.isSignedIn) {
		// console.log("object");

		// console.log("in signup redirect");
		// window.location.href = "/signup.html";


	}


	// if (document.querySelector("#mainSignInPage")) {
	// 	document.querySelector("#calendar").onclick = (event) => {
	// 		window.location.href = "/calendar.html";
	// 	}
	// }
	// document.querySelector("#mainSignInPage")
	if (!document.querySelector("#mainPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/";
	}


	// if(!rhit.fbAuthManager.isSignedIn){
	// 	window.location.href = "/";
	// }

	// if (!document.querySelector("#mainPage") && !rhit.fbAuthManager.isSignedIn){
	// 	console.log("in login redirect");
	// 	window.location.href = "/login.html";
	// }
}

rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#signup").onclick = (event) => {
			rhit.fbAuthManager.signIn();

		}
	}
}

rhit.HomePageController = class {
	constructor() {
		document.querySelector("#linksButton").addEventListener("click", (event) => {
			window.location.href = "/links.html";
		});
		document.querySelector("#settingsButton").addEventListener("click", (event) => {
			window.location.href = "/settings.html";
		});
		document.querySelector("#calendarButton").addEventListener("click", (event) => {
			window.location.href = "/calendar.html";
		});
		document.querySelector("#chatButton").onclick = (event) => {
			console.log("in chat");
			window.location.href = '/chatteams.html';
		}
	}

	methodName() {

	}
}

rhit.ChatTeamPageController = class {
	constructor() {

		rhit.fUsersManager.getPertinentTeams().then(
			(value) => {
				this.updateList(value);
			}
		).catch((error) => {
			console.error("Error adding document: ", error);
		}); // passing the function to be called; however causes bug is with this keyword
		// fix is to use .bind(this) to ensure that the callback uses the right this
	}

	_createCard(teamString) {
		return htmlToElement(`<div class="row pad">
		<div id="${teamString}" class="card col-12">
		<div class="card-body">
			<h5 id="name" class="card-title">${teamString}</h5>
		</div>
		</div>
	</div>
`);
	}

	updateList(teamList) {

		// make a new quoteListContainer
		const newList = htmlToElement('<div id="teamListContainer"></div>'); // whenever there's inner double quotes, use the opposite outside

		for (let i = 0; i < teamList.length; i++) {
			const mq = teamList[i]; // should return a string
			const newCard = this._createCard(mq);

			newCard.onclick = (event) => {
				console.log(`You clicked on ${mq.id}`);
				// rhit.storage.setMovieQuoteId(mq.id);
				// /moviequote goes to domain /moviequote
				window.location.href = `/chat.html?teamID=${mq}`;
			};
			newList.appendChild(newCard);
		}
		// fill the new quoteListContainer with quote cards using a loop



		// remove the old teamListContainer
		const oldList = document.querySelector("#teamListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;


		// put in the new quoteListContainer
		oldList.parentElement.appendChild(newList);
	}
}

rhit.ChatController = class {
	constructor() {
		document.querySelector("#submitAddEvent").onclick = (event) => {
			const messageStr = document.querySelector("#messageContents").value;
			document.querySelector('#messageContents').value = "";
			console.log('message :>> ', messageStr);
			rhit.fbChatManager.add(messageStr);

		}


		rhit.fbChatManager.beginListening(this.updateList.bind(this));
	}


	_createCard(mq) {
		let date = mq.date.toDate();
		let firstPart = date.toLocaleTimeString("en-US").substring(0, date.toLocaleTimeString("en-US").lastIndexOf(":"));
		let secondPart = date.toLocaleTimeString("en-US").substring(date.toLocaleTimeString("en-US").lastIndexOf(" "), date.toLocaleTimeString("en-US").length);
		let mmDDYY = mq.date.toDate().toLocaleDateString("en-US").substring(0,(mq.date.toDate().toLocaleDateString("en-US")).length-4);
		mmDDYY += mq.date.toDate().toLocaleDateString("en-US").substring((mq.date.toDate().toLocaleDateString("en-US")).length-2,(mq.date.toDate().toLocaleDateString("en-US")).length);
		console.log('mmDDYY :>> ', mmDDYY);
		let outputString = mmDDYY + ' ' + firstPart + ' ' + secondPart;
		// console.log('mq.sender :>> ', mq.sender);
		// console.log('fb.AuthManager.uid :>> ', rhit.fbAuthManager.uid);
		console.log('mq.edited :>> ', mq.edited);
		let changedOrNot = "";
		if(mq.edited==true){
			changedOrNot = "(edited)"
		}
		if (rhit.fbAuthManager.uid === mq.sender) {
			return htmlToElement(`<div id="${mq.id}" class="self row pad">	
		<div id="messContainer" class="bg-primary card col-1 col-5">
		<div class="card-body" data-toggle="modal" data-target="#opsModal">
		<h7 id="name" class="card-title">${mq.sender}&nbsp;&nbsp;&nbsp;${outputString}&nbsp;&nbsp;&nbsp;${changedOrNot}</h7>
			<h6 id="message" class="card-title">${mq.message}</h6>
			
			
			</div>
		</div>
		</div>
	</div>
<br />`)
		}
		return htmlToElement(`<div id="other" class="row pad">	
		<div id="messContainer" class="card col-1 col-5">
		<div class="card-body">
		<h7 id="name" class="card-title">${mq.sender}&nbsp;&nbsp;&nbsp;${outputString}&nbsp;&nbsp;&nbsp;${changedOrNot}</h7>
			<h6 id="message" class="card-title">${mq.message}</h6>
			
			
			</div>
		</div>
		</div>
	</div>
<br />`);
	}
	updateList() {

		//Make a new quoteListContainer
		const newList = htmlToElement('<div id="mainChatPage"></div>');
		//Fill the quoteListContainer with quote cards using a loop
		for (let i = 0; i < rhit.fbChatManager.length; i++) {
			const mq = rhit.fbChatManager.getMessageAtIndex(i);
			console.log('mq :>> ', mq);
			// console.log('mq message :>> ', mq.message);
			// console.log('mq.date.toDate() :>> ', mq.date.toDate());
			console.log('mq.id :>> ', mq.id);
			const newCard = this._createCard(mq);
			newCard.onclick = (event) => {
				$('#opsModal').on('show.bs.modal', (event) => {
					// pre animation
					// document.querySelector("#inputQuote").value = rhit.fbSingleQuoteManager.quote;
					// document.querySelector("#inputMovie").value = rhit.fbSingleQuoteManager.movie;
					console.log('newCard :>> ', newCard);
				
				
				console.log('newCard.id :>> ', newCard.id);
				document.querySelector("#submitDeleteQuote").onclick = (event) => {
					$('#opsModal').modal('hide');
					rhit.fbChatManager.delete(newCard.id).then(() => {
						console.log("Document successfully deleted!");
						// window.location.href = "/list.html";
					}).catch((error) => {
						console.error("Error removing document: ", error);
					});
				}
		
				$('#editQuoteDialog').on('show.bs.modal', (event) => {
					// pre animation
					// console.log('mq.message :>> ', mq.message);
					document.querySelector("#inputMessage").value = mq.message;
					// document.querySelector("#inputMovie").value = rhit.fbSingleQuoteManager.movie;
				})

				$('#editQuoteDialog').on('shown.bs.modal', (event) => {
					// post animation
					document.querySelector("#inputMessage").focus();
				})

				document.querySelector("#submitEditQuote").onclick = (event) => {
					console.log('mq :>> ', mq);
					const message = document.querySelector("#inputMessage").value;
					// const movie = document.querySelector("#inputMovie").value;
					// mq.message = message;
					rhit.fbChatManager.update(newCard.id,message);
					$('#opsModal').modal('hide');
				}
			})
			}
			
			// this.editDelete(newCard,mq); 


			// newCard.onclick = (event) => {
				
			// }
			// newCard.onclick = (event) => {
			// 	console.log('mq.message :>> ',mq.message)
			// }
			newList.appendChild(newCard);
		}
		//Remove the quoteListContainer
		const oldList = document.querySelector("#mainChatPage");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		//Put in the new quoteListContainer
		oldList.parentElement.appendChild(newList);
	}
}

rhit.FbChatManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(`/RoseConnectTeams/${this._uid}/Chat`);
		this._unsubscribe = null;
		this._messageId = null;
	}
	add(message) {
		this._ref = firebase.firestore().collection(`/RoseConnectTeams/${this._uid}/Chat`)

		// Add a new document with a generated id.
		console.log('this._uid :>> ', this._uid);
		console.log('typeof this._uid :>> ', typeof this._uid);
		this._ref.add({
			[rhit.FB_KEY_EDITED]: false,
			[rhit.FB_KEY_MESSAGE]: message,
			[rhit.FB_KEY_SENDER]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
		})
			.then((docRef) => {
				console.log("Chat document written with ID: ", docRef.id);
				rhit.fbChatManager._messageId = docRef.id;
			})
			.catch((error) => {
				console.error("Error adding document: ", error);
			});
	}
	update(id,message){
		this._ref.doc(id).update({
			[rhit.FB_KEY_EDITED]: true,
			[rhit.FB_KEY_MESSAGE]: message,
			[rhit.FB_KEY_SENDER]: rhit.fbAuthManager.uid
			// [rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
		})
			.then((docRef) => {
				console.log("Chat document written with ID: ", docRef.id);
				rhit.fbChatManager._messageId = docRef.id;
			})
			.catch((error) => {
				console.error("Error adding document: ", error);
			});
	}
	beginListening(changeListener) {
		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED).limit(50);
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}

	get length() {
		return this._documentSnapshots.length;
	}
	get message(){
		return this._documentSnapshot.get(rhit.FB_KEY_MESSAGE);
	}
	getMessageAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const mq = new rhit.Chat(docSnapshot.id,docSnapshot.get(rhit.FB_KEY_MESSAGE), docSnapshot.get(rhit.FB_KEY_SENDER), docSnapshot.get(rhit.FB_KEY_LAST_TOUCHED),docSnapshot.get(rhit.FB_KEY_EDITED));
		return mq;
	}

	delete(id) {
		console.log('this._ref :>> ', this._ref);
		console.log('this._ref.doc :>> ', this._ref.doc);
		// console.log('rhit.fbChatManager._messageId :>> ', rhit.fbChatManager._messageId);
		return this._ref.doc(id).delete();
	}

}

rhit.Chat = class {
	constructor(id,message, sender, date, edited) {
		this.id = id;
		this.message = message;
		this.sender = sender;
		this.date = date;
		this.edited = edited;
	}
}

rhit.SettingsController = class {
	constructor() {
		rhit.fUsersManager.getPertinentTeams().then(
			(value) => {
				this.updateList(value);
			}
		).catch((error) => {
			console.error("Error adding document: ", error);
		}); // passing the function to be called; however causes bug is with this keyword
		rhit.fUsersManager.getSchedule().then(
			(schedule) => {
				// Sets up the local storage for later writing and modification
				let words = [];
				for (let i = 0; i < schedule.length; i++) {
					words.push(schedule[i]);
				}
				window.sessionStorage.setItem("words", JSON.stringify(words));

				// Pushes the buttons
				for (let i = 0; i < words.length; i++) {
					const curSelec = words[i].substring(0, 5)+ words[i].substring(6,8)+words[i].substring(9);
					let burton = document.querySelector(curSelec); // 
					while (!burton) {
						burton = document.querySelector("."+curSelec);
					}
					burton.setAttribute("class", "redsquare scheduleButton "+curSelec);
				}
			}
		).catch((error) => {
			console.error("Error adding document: ", error);
		});
		
		document.querySelector("#saveScheduleButton").onclick = (event) => {
			// First get the previous schedule (DONE IN CONSTRUCTOR FOR CONTROLLER)			
			// Will be very similar to the calendar saving with usermanager; promise, and then a .then that takes us back to this homepage
			let saveSchedulePromise = rhit.fUsersManager.saveSchedule();
		}
		document.querySelector("#clearScheduleButton").onclick = (event) => {
			let clearSchedulePromise = rhit.fUsersManager.clearSchedule();
			clearSchedulePromise.then(() => {
				// Unpushes the buttons
				let words = JSON.parse(window.sessionStorage.getItem("words")) || [];
				console.log("WARS: "+words);
				for (let i = 0; i < words.length; i++) {
					const curSelec = words[i].substring(0, 5)+ words[i].substring(6,8)+words[i].substring(9);
					let burton = document.querySelector(curSelec); // 
					while (!burton) {
						burton = document.querySelector("."+curSelec);
					}
					burton.setAttribute("class", "square scheduleButton "+curSelec);
					console.log("current selection: " +curSelec);
				}
				window.sessionStorage.clear(); // clears schedule
			});
		}
		$('#addQuoteDialog').on('show.bs.modal',(event) => {
            console.log('document.querySelector("#inputTeam") :>> ', document.querySelector("#inputTeam"));
            document.querySelector('#submitNewTeam').onclick = (event) => {
			let tString = document.querySelector("#inputTeam").value;
			console.log('tString :>> ', tString);

			console.log("NOT STILL WAITING");
			rhit.fUsersManager.addUserToTeams(tString, "" ,"", "")
			.then(() => {
				console.log("done waiting");
				setTimeout(function () {window.location.reload();}, 1000);

			})
			console.log("past timeout");
		};
    	})
	}
	_createCard(teamString) {
		return htmlToElement(`<div class="row pad">
		<div id="${teamString}" class="card col-12">
		<div class="card-body" data-toggle="modal" data-target="#deleteQuoteDialog">
			<h5 id="name" class="card-title">${teamString}</h5>
		</div>
		</div>
	</div>
`);
	}

	updateList(teamList) {

		// make a new quoteListContainer
		const newList = htmlToElement('<div id="teamListContainer"></div>'); // whenever there's inner double quotes, use the opposite outside
		if (teamList.length >= 4) {
			document.querySelector("#newEventButton").hidden = true;
		}
		for (let i = 0; i < teamList.length; i++) {
			const mq = teamList[i]; // should return a string
			const newCard = this._createCard(mq);
			
			newCard.onclick = (event) => {
				// console.log(`You clicked on ${mq}`);
				$('#deleteQuoteDialog').on('show.bs.modal', (event) => {
					// console.log(`You clicked on ${mq}`);
					document.querySelector('#teamDelete').innerHTML = `Are you sure you want to leave team ${mq}?`;
					document.querySelector('#submitDeleteQuote').onclick = (event) => {
						rhit.fUsersManager.deleteUserFromTeam(mq)
						.then((event) => {
							window.location.reload();
						})
					}
					// pre animation
					// document.querySelector("#inputQuote").value = rhit.fbSingleQuoteManager.quote;
					// document.querySelector("#inputMovie").value = rhit.fbSingleQuoteManager.movie;
				})
				
				
			};
			newList.appendChild(newCard);	
		}
		// fill the new quoteListContainer with quote cards using a loop



		// remove the old teamListContainer
		const oldList = document.querySelector("#teamListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;


		// put in the new quoteListContainer
		oldList.parentElement.appendChild(newList);
	}
}

rhit.initializePage = function () {
	// console.log(rhit.fUsersManager.isNewUser+": is new user");
	// const urlParams = new URLSearchParams(window.location.search);
	console.log("Ready");
	let newUser = rhit.fUsersManager.isNewUser();

	if (document.querySelector("#linksPage")) {
		addNavListeners();
	}
	if (document.querySelector("#homePage")) {
		new rhit.HomePageController();
	}

	if (document.querySelector("#mainPage")) {
		new rhit.LoginPageController();
		// Takes value of the promise
		if (rhit.fbAuthManager.isSignedIn) {
			newUser.then(
				(value) => {
					if (value) {
						window.location.href = "/signup.html";
					} else {
						window.location.href = "/home.html";
					}
				}
			).catch((error) => {
				console.error("Error adding document: ", error);
			});
		}
	}


	if (document.querySelector("#mainSignInPage")) {
		new rhit.SignUpController();
	}

	if (document.querySelector("#mainSettingsPage")) {
		addNavListeners();
		new rhit.SettingsController();
	}

	if (document.querySelector("#chatTeamPage")) {
		addNavListeners();
		new rhit.ChatTeamPageController();
	}

	if (document.querySelector("#homePage")) {

		document.querySelector("#signoutButton").onclick = (event) => {
			rhit.fbAuthManager.signOut();
		}
	}
	const urlParams = new URLSearchParams(window.location.search);
	console.log('init page urlParams.get("id") :>> ', urlParams.get("id"));
	console.log("i need to update the list on the page");
	if (document.querySelector("#mainCalendarPage")) {
		addNavListeners();
		rhit.fUsersManager.getPertinentTeams().then(

			(value) => {
				console.log("Pertinent teams: " + value);
				rhit.currentTeam = value[0]; // default selected team
				rhit.fbCalendarManager = new rhit.FbCalendarManager(value);
				new rhit.CalendarController(value);
			}
		).catch((error) => {
			console.error("Error adding document: ", error);
		});
	}

	if (document.querySelector("#mainChatPage")) {
		addNavListeners();
		rhit.fbChatManager = new rhit.FbChatManager(urlParams.get('teamID'));
		new rhit.ChatController();
	}

	if (document.querySelector("#detailPage")) {
		console.log("you are on the detail page");
		// const movieQuoteId = rhit.storage.getMovieQuoteId();

		const movieQuoteId = urlParams.get("id");
		// console.log(`detail page for ${rhit.storage.getMovieQuoteId()}`);
		// if (!movieQuoteId) {
		// 	console.log("Error! Missing movie quote id!");
		// 	window.location.href = "/";
		// }
		rhit.fbDetailPageManager = new rhit.FbDetailPageManager(movieQuoteId);
		new rhit.DetailPageController();
		//new rhit.SignUpController();
	}


}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fUsersManager = new rhit.FUsersManager();
	// rhit.fbUserManager = new rhit.FbUserManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("Is signed in: " + rhit.fbAuthManager.isSignedIn);
		//check for redirects
		rhit.checkForRedirects();

		//page initialization
		rhit.initializePage();
	});
	rhit.fUsersManager.beginListening();
	// //Temp code for read and add
	// const ref = firebase.firestore().collection("MovieQuotes");
	// ref.onSnapshot((querySnapshot) => {
	//     querySnapshot.forEach((doc) => {
	// 		console.log(doc.data());
	//     });
	// });

	// ref.add({
	// 	quote: "My Second Test",
	// 	movie: "My Second Movie",
	// 	lastTouched: firebase.firestore.Timestamp.now()
	// });
};

rhit.main();