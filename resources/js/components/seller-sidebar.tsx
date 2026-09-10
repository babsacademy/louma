import { Link } from '@inertiajs/react';
import { ClipboardList, LayoutDashboard, Settings, Store } from 'lucide-react';

import AppLogoIcon from '@/components/app-logo-icon';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard as sellerDashboard } from '@/routes/seller';
import { index as shopsIndex } from '@/routes/seller/shops';
import { index as ordersIndex } from '@/routes/seller/orders';
import { edit as profileEdit } from '@/routes/profile';

export function SellerSidebar() {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={sellerDashboard.url()} prefetch>
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                                    <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                                </div>
                                <div className="ml-1 flex flex-col text-left text-sm leading-tight">
                                    <span className="truncate font-semibold tracking-tight">
                                        Louma Guinard
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                        Espace vendeur
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="space-y-1">
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Mon activité</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(sellerDashboard.url())}
                                tooltip={{ children: 'Tableau de bord' }}
                            >
                                <Link href={sellerDashboard.url()} prefetch>
                                    <LayoutDashboard className="size-4" />
                                    <span>Tableau de bord</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentOrParentUrl(
                                    shopsIndex.url(),
                                )}
                                tooltip={{ children: 'Mes boutiques' }}
                            >
                                <Link href={shopsIndex.url()} prefetch>
                                    <Store className="size-4" />
                                    <span>Mes boutiques</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentOrParentUrl(
                                    ordersIndex.url(),
                                )}
                                tooltip={{ children: 'Commandes' }}
                            >
                                <Link href={ordersIndex.url()} prefetch>
                                    <ClipboardList className="size-4" />
                                    <span>Commandes</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Compte</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(profileEdit.url())}
                                tooltip={{ children: 'Paramètres' }}
                            >
                                <Link href={profileEdit.url()} prefetch>
                                    <Settings className="size-4" />
                                    <span>Paramètres</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
