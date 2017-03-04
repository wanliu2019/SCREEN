import React from 'react'

import {tabPanelize} from '../../../common/utility'

class TabTutorial extends React.Component {
    constructor(props) {
	super(props);
        this.key = "tutorial"
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    render() {
        return (tabPanelize(
            <div>
                <h2>Tutorials</h2>
                <h3>Main Search</h3>
                <iframe width="560" height="315"
                        src="https://www.youtube.com/embed/iB9VUgZO8NA"
                        frameborder="0" allowfullscreen>
                </iframe>

                <h3>Gene Expression</h3>
                <iframe width="560" height="315"
                        src="https://www.youtube.com/embed/Vs6NQRKMAdM"
                        frameborder="0" allowfullscreen>
                </iframe>
	    </div>));
    }
}

export default TabTutorial;