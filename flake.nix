{
  description = "Tree-sitter grammar for ";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.10";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }@inputs:
    flake-utils.lib.eachDefaultSystem
      (system:
        let
          pkgs = import nixpkgs {
            inherit system;
          };

          packages = with pkgs; [
            nodejs_25
            PACKAGES
            rich-cli
          ];
        in
          {
            devShells = {
              default = pkgs.mkShell {
                buildInputs = [ packages ];
                runtimeInputs = [ packages ];
                shellHook = ''
                    rich "[b white on black]Using npm [/][b white on red] $(npm --version)[/]

[b white on black]with packages[/]

$(npm list)" --print --padding 1 -p -a heavy
                '';
              };
            };
          }
      );
};
