class Row extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            contents: props.contents,
            time: props.time,
        }
    }

    render(){
        return(
            <>
            {
                <div className="row"  >
                <span className="time">
                    {this.state.time?this.state.time:"Time Slot"}
                </span>
                {this.state.contents}
            </div>}
          </>
        )
    }


}