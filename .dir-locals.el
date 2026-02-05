(
 (nil . (
         (eval .
               (set (make-local-variable 'exec-path) (cons "./node_modules/.bin" exec-path)))
         ;; run and compilation commands for GProM
         (projectile-project-compilation-cmd . "tree-sitter generate")
         (projectile-project-test-cmd . "tree-sitter test")
         (projectile-project-run-cmd . "./node_modules/.bin/tree-sitter generate && ./node_modules/.bin/tree-sitter build-wasm && ./node_modules/.bin/tree-sitter playground")
         (projectile-project-install-cmd . "tree-sitter generate && tree-sitter build-wasm")
         (projectile-project-configure-cmd . "npm install")
         ))
 )
