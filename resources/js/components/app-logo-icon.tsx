import { ShoppingBasket } from 'lucide-react';
import type { ComponentProps } from 'react';

export default function AppLogoIcon(
    props: ComponentProps<typeof ShoppingBasket>,
) {
    return <ShoppingBasket {...props} />;
}
