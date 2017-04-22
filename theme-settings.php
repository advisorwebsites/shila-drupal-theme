<?php

use Drupal\Core\Render\Element;
use Drupal\Component\Serialization\Json;

/**
 * Implements hook_form_FORM_ID_alter().
 *
 * @param $form
 *   The form.
 * @param $form_state
 *   The form state.
 */
function aw_plain_form_system_theme_settings_alter(&$form, &$form_state) {
  $form['#submit'][] = 'writeVariablesJson';
  $form['variables'] = [
    '#type' => 'details',
    '#open' => TRUE,
    '#title' => t('CSS Variables'),
  ];
  $form['variables']['color-primary'] = [
    '#type' => 'color',
    '#title' => 'Primary Color',
    '#default_value' => theme_get_setting('color-primary'),
  ];
}

function writeVariablesJson(&$form, \Drupal\Core\Form\FormState &$form_state) {
  $activeTheme = \Drupal::configFactory()->get('system.theme')->get('default');
  $siteStyles = \Drupal::service('themes.aw_themes')->siteStylesDir();
  $filename = DRUPAL_ROOT .'/'. $siteStyles .'/aw_plain_variables.json';
  // putenv('PATH=/usr/local/bin/'); #enable for localhost
  // file_put_contents($filename, $scss);
  $variables_array = Element::children($form['variables']);
  $variables_values = [];
  foreach ($variables_array as $key) {
    $variables_values[$key] = $form_state->getValue($key);
  }
  file_put_contents($filename, Json::encode($variables_values));
  \Drupal::service('themes.aw_themes')->runGulp('aw_plain', \Drupal::request()->get('SERVER_NAME'));
  // ksm($form, $form_state, \Drupal::request(), $form_state->getValues(), $variables_values, $variables);
}
