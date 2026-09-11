import { Link } from '@inertiajs/react';
import {
    CreditCard,
    LayoutDashboard,
    Settings,
    ShieldCheck,
    ShoppingBag,
    Store,
    Users,
    Wallet,
} from 'lucide-react';
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
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as sellersIndex } from '@/routes/admin/sellers';
import { index as shopsIndex } from '@/routes/admin/shops';
import { index as ordersIndex } from '@/routes/admin/orders';
import { index as paymentsIndex } from '@/routes/admin/payments';
import { index as payoutsIndex } from '@/routes/admin/payouts';
import { edit as profileEdit } from '@/routes/profile';

export function AdminSidebar() {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={adminDashboard.url()} prefetch>
                                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-amber-500 text-stone-950">
                                    <AppLogoIcon className="size-5" />
                                </div>
                                <div className="ml-1 flex flex-col text-left text-sm leading-tight">
                                    <span className="truncate font-semibold tracking-tight">
                                        Louma Guinard
                                    </span>
                                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                        <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-500" />
                                        <span>Administration</span>
                                    </div>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="space-y-1">
                {/* Section Principal */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Principal</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(adminDashboard.url())}
                                tooltip={{ children: 'Tableau de bord' }}
                            >
                                <Link href={adminDashboard.url()} prefetch>
                                    <LayoutDashboard className="size-4" />
                                    <span>Tableau de bord</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Section Gestion */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Gestion</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentOrParentUrl(
                                    sellersIndex.url(),
                                )}
                                tooltip={{ children: 'Vendeurs' }}
                            >
                                <Link href={sellersIndex.url()} prefetch>
                                    <Users className="size-4" />
                                    <span>Vendeurs</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentOrParentUrl(
                                    shopsIndex.url(),
                                )}
                                tooltip={{ children: 'Boutiques' }}
                            >
                                <Link href={shopsIndex.url()} prefetch>
                                    <Store className="size-4" />
                                    <span>Boutiques</span>
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
                                    <ShoppingBag className="size-4" />
                                    <span>Commandes</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Section Finances */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Finances</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentOrParentUrl(
                                    paymentsIndex.url(),
                                )}
                                tooltip={{
                                    children: 'Paiements',
                                }}
                            >
                                <Link href={paymentsIndex.url()} prefetch>
                                    <CreditCard className="size-4" />
                                    <span>Paiements</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentOrParentUrl(
                                    payoutsIndex.url(),
                                )}
                                tooltip={{
                                    children: 'Reversements',
                                }}
                            >
                                <Link href={payoutsIndex.url()} prefetch>
                                    <Wallet className="size-4" />
                                    <span>Reversements</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Section Configuration */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Configuration</SidebarGroupLabel>
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
