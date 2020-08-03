import { EventData, Page } from '@nativescript/core';
import { MainViewModel } from './main-view-model';

export function onNavigatingTo(args: EventData) {
    let viewModel = new MainViewModel();
    let page = <Page>args.object;

    page.bindingContext = viewModel;
}