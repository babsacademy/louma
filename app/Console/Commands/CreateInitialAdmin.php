<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

#[Signature('app:create-initial-admin {--name= : Nom complet de l’administrateur} {--email= : Adresse e-mail de l’administrateur}')]
#[Description('Crée de manière interactive le premier administrateur de production')]
class CreateInitialAdmin extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (User::query()->where('role', UserRole::Admin)->exists()) {
            $this->error('Un administrateur existe déjà. Utilisez la gestion des vendeurs ou une procédure administrée pour les comptes suivants.');

            return self::FAILURE;
        }

        $name = (string) ($this->option('name') ?: $this->ask('Nom complet'));
        $email = (string) ($this->option('email') ?: $this->ask('Adresse e-mail'));
        $password = (string) $this->secret('Mot de passe');
        $passwordConfirmation = (string) $this->secret('Confirmer le mot de passe');

        Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $passwordConfirmation,
        ], [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::default(), 'confirmed'],
        ])->validate();

        $administrator = new User;
        $administrator->name = $name;
        $administrator->email = $email;
        $administrator->password = $password;
        $administrator->role = UserRole::Admin;
        $administrator->active = true;
        $administrator->email_verified_at = now();
        $administrator->save();

        $this->info("Administrateur créé pour {$administrator->email}.");

        return self::SUCCESS;
    }
}
