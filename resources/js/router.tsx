import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Dashboard from './components/dashboard';
import OtherComponent from './components/other-component';

function AppRouter() {
    return (
        <Router>
            <Switch>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/other" component={OtherComponent} />
                {/* Ensure there are no redirects to the dashboard */}
            </Switch>
        </Router>
    );
}

export default AppRouter;
