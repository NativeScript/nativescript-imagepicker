import { EventData } from 'tns-core-modules/data/observable';
import { Page } from 'tns-core-modules/ui/page';
import { MainViewModel } from './main-view-model';

let viewModel;

export function pageLoaded(args: EventData) {
    viewModel = viewModel || new MainViewModel();

    let page = <Page>args.object;
    page.bindingContext = viewModel;
}