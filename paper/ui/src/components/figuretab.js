let React = require('react');
import Figure from './figure'

class FigureTab extends React.Component {

    constructor(props) {
	super(props);
	this.state = {
	    figures: this._get_figures(props),
	    selected_figure: 0
	};
    }

    setSelection(i) {
	this.setState({ selected_figure: i });
    }

    componentWillReceiveProps(props) {
	this.setState({ figures: this._get_figures(props) });
    }
    
    render() {
        return (
	    <div className="row">
	        <ul className="nav nav-pills nav-stacked col-xs-2">
	          {this.state.figures.map( (f, i) => (
		    <li key={"li" + i} className={i === this.state.selected_figure ? "active" : ""}>
	                <a href="#" onClick={() => {this.setSelection(i)}}>{f.title}</a>
	  	    </li>
		  ) )}
	        </ul>
		<div className="col-xs-10">
	          {this.state.figures.map( (f, i) => ( i !== this.state.selected_figure ? null : 
 	            <Figure key={"fig" + i} number={i} title={f.title} description={f.legend} url={f.url} />
		  ) )}
	        </div>
	    </div>
	);
    }

}
export default FigureTab;
