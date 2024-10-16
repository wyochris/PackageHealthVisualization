class Square extends React.Component {
  constructor(props){
      super(props);

      this.state = {
          // name: props.name,
          day:props.day,
          time:props.time,
          available:false,
      }
  }

  toggleActivation() {
    // Gets itself
    const doc = document.querySelector("."+this.state.day+this.state.time.substring(0, 2)+this.state.time.substring(3,5)+this.state.time.substring(6)); // gets this own components class

    let prevActive = doc.getAttribute('class').includes("redsquare"); // Allows outside modifications to the DOM to affect the component
    if (!prevActive) {
        let words = JSON.parse(window.sessionStorage.getItem("words")) || [];
        words.push(this.state.day+this.state.time);
        window.sessionStorage.setItem("words", JSON.stringify(words));
    } else {
        let words = JSON.parse(window.sessionStorage.getItem("words")) || [];
        if (words) {
            words.splice(words.indexOf(this.state.day+this.state.time),1);
            window.sessionStorage.setItem("words", JSON.stringify(words));
        }
    }
    this.setState({ available: !prevActive }); // doesn't seem to apply until some time after the if
  };

  render(){
      return(
          <>
            <div className={[this.state.available?"redsquare scheduleButton "+this.state.day+this.state.time.substring(0, 2)+this.state.time.substring(3,5)+this.state.time.substring(6)
            :"square scheduleButton "+this.state.day+this.state.time.substring(0, 2)+this.state.time.substring(3,5)+this.state.time.substring(6)]} onClick={(this.toggleActivation.bind(this))} >

            </div>
          </>
      )
  }
}

/*
class Square extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        name: 'G',
        appVersion: ''
    }
}

render() {
    return(
        <><h2>Hello {this.state.name || 'Friend'}! Welcome Back.</h2>
        {
            this.state.appVersion && this.state.appVersion < 2
            ? <p>Your app is out of date.</p>
            : ''
        }
        <button>Download</button></>
    )
}
}
*/