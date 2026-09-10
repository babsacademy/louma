export const formatFcfa = (amount: number): string =>
    new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
