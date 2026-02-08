(
 (nil . (
         (eval .
               (set (make-local-variable 'exec-path) (cons "./node_modules/.bin" exec-path)))
         ;; run and compilation commands for GProM
         (projectile-project-compilation-cmd . "npm run build-grammar")
         (projectile-project-test-cmd . "npm run test")
         (projectile-project-run-cmd . "npm run playground")
         (projectile-project-install-cmd . "npm run build-grammar")
         (projectile-project-configure-cmd . "npm run install")
         ))
 )
